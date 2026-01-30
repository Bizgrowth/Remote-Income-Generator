import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { AIResumeOptimizer } from '../services/aiResumeOptimizer';
import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';

const router = Router();

/**
 * GET /api/optimize/test-ai
 * Test endpoint to verify Anthropic API connectivity (no auth required for debugging)
 */
router.get('/test-ai', async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'ANTHROPIC_API_KEY is not configured'
      });
    }

    // Try to make a minimal API call
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [{ role: 'user', content: 'Say "API working" in exactly 2 words.' }]
    });

    const text = response.content[0]?.type === 'text' ? response.content[0].text : 'No response';

    res.json({
      success: true,
      message: 'Anthropic API is working',
      apiKeyConfigured: true,
      apiKeyPrefix: apiKey.substring(0, 15) + '...',
      model: 'claude-3-5-sonnet-20241022',
      testResponse: text.trim()
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('AI test error:', error);
    res.status(500).json({
      success: false,
      error: errorMessage,
      apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
      hint: 'Check if the API key is valid and has access to Claude models'
    });
  }
});

// All routes below require authentication
router.use(requireAuth);

/**
 * POST /api/optimize/resume
 * Optimize a resume for a specific favorited job
 */
router.post('/resume', async (req: Request, res: Response) => {
  try {
    const { favoriteJobId, resumeId } = req.body;

    if (!favoriteJobId) {
      return res.status(400).json({ error: 'favoriteJobId is required' });
    }

    // Get the favorite job
    const favoriteJob = await prisma.favoriteJob.findFirst({
      where: {
        id: favoriteJobId,
        userId: req.user!.userId,
      },
    });

    if (!favoriteJob) {
      return res.status(404).json({ error: 'Favorite job not found' });
    }

    // Get the resume (use specified or primary)
    let resume;
    if (resumeId) {
      resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user!.userId,
        },
      });
    } else {
      resume = await prisma.resume.findFirst({
        where: {
          userId: req.user!.userId,
          isPrimary: true,
        },
      });
    }

    if (!resume) {
      return res.status(404).json({
        error: 'No resume found. Please upload a resume first.',
      });
    }

    // Check if we already have an optimized version
    const existing = await prisma.optimizedResume.findUnique({
      where: {
        resumeId_favoriteJobId: {
          resumeId: resume.id,
          favoriteJobId: favoriteJob.id,
        },
      },
    });

    if (existing && req.body.force !== true) {
      return res.json({
        message: 'Using cached optimized resume',
        optimizedResume: {
          ...existing,
          optimizedExperience: JSON.parse(existing.optimizedExperience),
          optimizedSkills: JSON.parse(existing.optimizedSkills),
          keywordsMatched: existing.keywordsMatched
            ? JSON.parse(existing.keywordsMatched)
            : [],
          keywordsMissing: existing.keywordsMissing
            ? JSON.parse(existing.keywordsMissing)
            : [],
          suggestions: existing.suggestions ? JSON.parse(existing.suggestions) : [],
        },
        cached: true,
      });
    }

    // Optimize the resume
    const result = await AIResumeOptimizer.optimizeResume(
      resume.originalText,
      favoriteJob.description,
      favoriteJob.title,
      favoriteJob.company
    );

    // Save to database
    const saved = await AIResumeOptimizer.saveOptimizedResume(
      req.user!.userId,
      resume.id,
      favoriteJob.id,
      result
    );

    // Update application status
    await prisma.application.updateMany({
      where: {
        favoriteJobId: favoriteJob.id,
        userId: req.user!.userId,
      },
      data: {
        status: 'optimized',
        optimizedAt: new Date(),
        resumeUsed: resume.id,
      },
    });

    res.json({
      message: 'Resume optimized successfully',
      optimizedResume: {
        id: saved.id,
        optimizedSummary: result.optimizedSummary,
        optimizedExperience: result.optimizedExperience,
        optimizedSkills: result.optimizedSkills,
        fullOptimizedText: result.fullOptimizedText,
        atsScore: result.atsAnalysis.score,
        keywordsMatched: result.atsAnalysis.keywordsMatched,
        keywordsMissing: result.atsAnalysis.keywordsMissing,
        suggestions: result.atsAnalysis.suggestions,
      },
      cached: false,
    });
  } catch (error) {
    console.error('Resume optimization error:', error);
    const message = error instanceof Error ? error.message : 'Failed to optimize resume';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/optimize/cover-letter
 * Generate a cover letter for a favorited job
 */
router.post('/cover-letter', async (req: Request, res: Response) => {
  try {
    const { favoriteJobId, resumeId, tone = 'professional' } = req.body;

    if (!favoriteJobId) {
      return res.status(400).json({ error: 'favoriteJobId is required' });
    }

    const validTones = ['professional', 'enthusiastic', 'formal'];
    if (!validTones.includes(tone)) {
      return res.status(400).json({
        error: `Invalid tone. Must be one of: ${validTones.join(', ')}`,
      });
    }

    // Get the favorite job
    const favoriteJob = await prisma.favoriteJob.findFirst({
      where: {
        id: favoriteJobId,
        userId: req.user!.userId,
      },
    });

    if (!favoriteJob) {
      return res.status(404).json({ error: 'Favorite job not found' });
    }

    // Get the resume
    let resume;
    if (resumeId) {
      resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user!.userId,
        },
      });
    } else {
      resume = await prisma.resume.findFirst({
        where: {
          userId: req.user!.userId,
          isPrimary: true,
        },
      });
    }

    if (!resume) {
      return res.status(404).json({
        error: 'No resume found. Please upload a resume first.',
      });
    }

    // Generate cover letter
    const result = await AIResumeOptimizer.generateCoverLetter(
      resume.originalText,
      favoriteJob.description,
      favoriteJob.title,
      favoriteJob.company,
      tone as 'professional' | 'enthusiastic' | 'formal'
    );

    // Save to database
    const saved = await AIResumeOptimizer.saveCoverLetter(
      req.user!.userId,
      favoriteJob.id,
      resume.id,
      result.content,
      tone
    );

    // Update application with cover letter
    await prisma.application.updateMany({
      where: {
        favoriteJobId: favoriteJob.id,
        userId: req.user!.userId,
      },
      data: {
        coverLetterUsed: saved.id,
      },
    });

    res.json({
      message: 'Cover letter generated successfully',
      coverLetter: {
        id: saved.id,
        content: result.content,
        keyPoints: result.keyPoints,
        tone,
      },
    });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate cover letter';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/optimize/ats-check
 * Analyze ATS compatibility without full optimization
 */
router.post('/ats-check', async (req: Request, res: Response) => {
  try {
    const { favoriteJobId, resumeId } = req.body;

    if (!favoriteJobId) {
      return res.status(400).json({ error: 'favoriteJobId is required' });
    }

    // Get the favorite job
    const favoriteJob = await prisma.favoriteJob.findFirst({
      where: {
        id: favoriteJobId,
        userId: req.user!.userId,
      },
    });

    if (!favoriteJob) {
      return res.status(404).json({ error: 'Favorite job not found' });
    }

    // Get the resume
    let resume;
    if (resumeId) {
      resume = await prisma.resume.findFirst({
        where: {
          id: resumeId,
          userId: req.user!.userId,
        },
      });
    } else {
      resume = await prisma.resume.findFirst({
        where: {
          userId: req.user!.userId,
          isPrimary: true,
        },
      });
    }

    if (!resume) {
      return res.status(404).json({
        error: 'No resume found. Please upload a resume first.',
      });
    }

    // Analyze ATS compatibility
    const analysis = await AIResumeOptimizer.analyzeATS(
      resume.originalText,
      favoriteJob.description
    );

    res.json({
      message: 'ATS analysis complete',
      analysis: {
        score: analysis.score,
        matched: analysis.matched,
        missing: analysis.missing,
        suggestions: analysis.suggestions,
        formatIssues: analysis.formatIssues,
        resumeUsed: resume.name,
        jobTitle: favoriteJob.title,
        company: favoriteJob.company,
      },
    });
  } catch (error) {
    console.error('ATS analysis error:', error);
    const message = error instanceof Error ? error.message : 'Failed to analyze ATS compatibility';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/optimize/:favoriteJobId
 * Get existing optimized resume for a job
 */
router.get('/:favoriteJobId', async (req: Request, res: Response) => {
  try {
    const optimized = await prisma.optimizedResume.findFirst({
      where: {
        favoriteJobId: req.params.favoriteJobId,
        userId: req.user!.userId,
      },
      include: {
        resume: {
          select: { id: true, name: true },
        },
        favoriteJob: {
          select: { id: true, title: true, company: true },
        },
      },
    });

    if (!optimized) {
      return res.status(404).json({ error: 'No optimized resume found for this job' });
    }

    // Get cover letters for this job
    const coverLetters = await prisma.coverLetter.findMany({
      where: {
        favoriteJobId: req.params.favoriteJobId,
        userId: req.user!.userId,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      optimizedResume: {
        ...optimized,
        optimizedExperience: JSON.parse(optimized.optimizedExperience),
        optimizedSkills: JSON.parse(optimized.optimizedSkills),
        keywordsMatched: optimized.keywordsMatched
          ? JSON.parse(optimized.keywordsMatched)
          : [],
        keywordsMissing: optimized.keywordsMissing
          ? JSON.parse(optimized.keywordsMissing)
          : [],
        suggestions: optimized.suggestions ? JSON.parse(optimized.suggestions) : [],
      },
      coverLetters,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get optimized resume';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/optimize/:favoriteJobId/export/pdf
 * Export optimized resume as PDF
 */
router.get('/:favoriteJobId/export/pdf', async (req: Request, res: Response) => {
  try {
    const optimized = await prisma.optimizedResume.findFirst({
      where: {
        favoriteJobId: req.params.favoriteJobId,
        userId: req.user!.userId,
      },
      include: {
        resume: true,
      },
    });

    if (!optimized) {
      return res.status(404).json({ error: 'No optimized resume found' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="optimized-resume-${Date.now()}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc.fontSize(16).font('Helvetica-Bold').text('PROFESSIONAL SUMMARY', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(optimized.optimizedSummary);
    doc.moveDown();

    // Skills
    const skills = JSON.parse(optimized.optimizedSkills);
    doc.fontSize(16).font('Helvetica-Bold').text('SKILLS', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica').text(skills.join(' • '));
    doc.moveDown();

    // Experience
    const experience = JSON.parse(optimized.optimizedExperience);
    doc.fontSize(16).font('Helvetica-Bold').text('PROFESSIONAL EXPERIENCE', { underline: true });
    doc.moveDown(0.5);

    for (const exp of experience) {
      doc.fontSize(12).font('Helvetica-Bold').text(exp.title);
      doc.fontSize(11).font('Helvetica').text(`${exp.company} | ${exp.dates}`);
      doc.moveDown(0.3);

      for (const bullet of exp.bullets) {
        doc.fontSize(11).font('Helvetica').text(`• ${bullet}`, { indent: 20 });
      }
      doc.moveDown(0.5);
    }

    // ATS Score footer
    doc.moveDown();
    doc
      .fontSize(9)
      .font('Helvetica-Oblique')
      .fillColor('gray')
      .text(`ATS Optimization Score: ${optimized.atsScore}%`, { align: 'right' });

    doc.end();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export PDF';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/optimize/:favoriteJobId/export/docx
 * Export optimized resume as DOCX
 */
router.get('/:favoriteJobId/export/docx', async (req: Request, res: Response) => {
  try {
    const optimized = await prisma.optimizedResume.findFirst({
      where: {
        favoriteJobId: req.params.favoriteJobId,
        userId: req.user!.userId,
      },
    });

    if (!optimized) {
      return res.status(404).json({ error: 'No optimized resume found' });
    }

    const experience = JSON.parse(optimized.optimizedExperience);
    const skills = JSON.parse(optimized.optimizedSkills);

    // Build document sections
    const children: Paragraph[] = [];

    // Summary section
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL SUMMARY',
        heading: HeadingLevel.HEADING_1,
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun(optimized.optimizedSummary)],
      })
    );
    children.push(new Paragraph({ text: '' }));

    // Skills section
    children.push(
      new Paragraph({
        text: 'SKILLS',
        heading: HeadingLevel.HEADING_1,
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun(skills.join(' • '))],
      })
    );
    children.push(new Paragraph({ text: '' }));

    // Experience section
    children.push(
      new Paragraph({
        text: 'PROFESSIONAL EXPERIENCE',
        heading: HeadingLevel.HEADING_1,
      })
    );

    for (const exp of experience) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: exp.title, bold: true })],
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun(`${exp.company} | ${exp.dates}`)],
        })
      );

      for (const bullet of exp.bullets) {
        children.push(
          new Paragraph({
            children: [new TextRun(`• ${bullet}`)],
            indent: { left: 720 },
          })
        );
      }
      children.push(new Paragraph({ text: '' }));
    }

    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="optimized-resume-${Date.now()}.docx"`
    );
    res.send(buffer);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export DOCX';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/optimize/:favoriteJobId/export/txt
 * Export optimized resume as plain text (for easy copy-paste)
 */
router.get('/:favoriteJobId/export/txt', async (req: Request, res: Response) => {
  try {
    const optimized = await prisma.optimizedResume.findFirst({
      where: {
        favoriteJobId: req.params.favoriteJobId,
        userId: req.user!.userId,
      },
    });

    if (!optimized) {
      return res.status(404).json({ error: 'No optimized resume found' });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="optimized-resume-${Date.now()}.txt"`
    );
    res.send(optimized.fullOptimizedText);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to export text';
    res.status(500).json({ error: message });
  }
});

export default router;

