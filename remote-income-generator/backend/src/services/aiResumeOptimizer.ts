import Anthropic from '@anthropic-ai/sdk';
import prisma from '../lib/prisma';
import { extractJsonFromText } from '../utils/safeJson';

// Validate Anthropic API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn('WARNING: ANTHROPIC_API_KEY not set. AI features will not work.');
} else {
  console.log('ANTHROPIC_API_KEY is configured (starts with:', process.env.ANTHROPIC_API_KEY.substring(0, 10) + '...)');
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'missing-key',
});

// Use a valid Claude model - claude-3-5-sonnet is the latest stable Sonnet
const AI_MODEL = 'claude-3-5-sonnet-20241022';
const AI_TIMEOUT_MS = 60000; // 60 second timeout for AI calls

/**
 * Helper to add timeout to promises
 */
function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${operation} timed out after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Expert Recruiter Persona - 20 Years Experience
 * Specializes in ATS optimization and resume tailoring
 */
const RECRUITER_PERSONA = `You are an elite resume writer and recruiter with 20+ years of experience in talent acquisition across Fortune 500 companies and top tech firms. You have:

- Reviewed over 50,000 resumes throughout your career
- Deep expertise in Applicant Tracking Systems (ATS) and how they parse resumes
- Insider knowledge of what hiring managers and recruiters look for
- Experience placing candidates at Google, Amazon, Microsoft, Meta, and top startups
- Expertise in remote work opportunities and the gig economy

Your approach:
1. ALWAYS prioritize ATS compatibility - use exact keywords from the job description
2. Quantify achievements with specific metrics whenever possible
3. Use action verbs that demonstrate impact (led, drove, increased, reduced, built)
4. Keep formatting clean and parseable (no tables, columns, or graphics in text)
5. Tailor every bullet point to align with job requirements
6. Highlight transferable skills for career changers
7. Be honest - enhance presentation, never fabricate experience`;

export interface JobAnalysis {
  requiredSkills: string[];
  preferredSkills: string[];
  keyPhrases: string[];
  experienceLevel: string;
  industryKeywords: string[];
  softSkills: string[];
  technicalRequirements: string[];
}

export interface OptimizedResumeResult {
  optimizedSummary: string;
  optimizedExperience: {
    company: string;
    title: string;
    dates: string;
    bullets: string[];
  }[];
  optimizedSkills: string[];
  fullOptimizedText: string;
  atsAnalysis: {
    score: number;
    keywordsMatched: string[];
    keywordsMissing: string[];
    suggestions: string[];
  };
}

export interface CoverLetterResult {
  content: string;
  keyPoints: string[];
}

export class AIResumeOptimizer {
  /**
   * Analyze a job description to extract key requirements
   */
  static async analyzeJob(jobDescription: string, jobTitle: string): Promise<JobAnalysis> {
    const defaultAnalysis: JobAnalysis = {
      requiredSkills: [],
      preferredSkills: [],
      keyPhrases: [],
      experienceLevel: 'mid',
      industryKeywords: [],
      softSkills: [],
      technicalRequirements: [],
    };

    try {
      const response = await withTimeout(
        anthropic.messages.create({
          model: AI_MODEL,
          max_tokens: 2000,
          system: RECRUITER_PERSONA,
          messages: [
            {
              role: 'user',
              content: `Analyze this job posting and extract key information for resume optimization.

Job Title: ${jobTitle}

Job Description:
${jobDescription}

Return a JSON object with:
{
  "requiredSkills": ["skill1", "skill2"],
  "preferredSkills": ["skill1", "skill2"],
  "keyPhrases": ["exact phrases from job description that should appear in resume"],
  "experienceLevel": "entry/mid/senior/executive",
  "industryKeywords": ["industry-specific terms"],
  "softSkills": ["communication", "leadership", etc.],
  "technicalRequirements": ["specific tools, technologies, certifications"]
}

Be thorough - extract EVERY keyword and phrase that an ATS might look for.`,
            },
          ],
        }),
        AI_TIMEOUT_MS,
        'Job analysis'
      );

      const text =
        response.content[0]?.type === 'text' ? response.content[0].text : '';

      return extractJsonFromText<JobAnalysis>(text, defaultAnalysis);
    } catch (error) {
      console.error('AI job analysis error:', error);
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw new Error('Failed to analyze job. Please try again.');
    }
  }

  /**
   * Optimize a resume for a specific job
   */
  static async optimizeResume(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    company: string
  ): Promise<OptimizedResumeResult> {
    // First, analyze the job
    const jobAnalysis = await this.analyzeJob(jobDescription, jobTitle);

    // Then optimize the resume
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 4000,
      system: RECRUITER_PERSONA,
      messages: [
        {
          role: 'user',
          content: `Optimize this resume for the following job. Your goal is to maximize ATS score while maintaining authenticity.

TARGET JOB:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

KEY REQUIREMENTS IDENTIFIED:
Required Skills: ${jobAnalysis.requiredSkills.join(', ')}
Preferred Skills: ${jobAnalysis.preferredSkills.join(', ')}
Key Phrases to Include: ${jobAnalysis.keyPhrases.join(', ')}
Technical Requirements: ${jobAnalysis.technicalRequirements.join(', ')}

CURRENT RESUME:
${resumeText}

INSTRUCTIONS:
1. Rewrite the professional summary to directly address this role at ${company}
2. Reorder and rewrite experience bullets to highlight relevant achievements
3. Use EXACT keywords from the job description where truthfully applicable
4. Quantify achievements with metrics where possible
5. Prioritize skills that match the job requirements

Return a JSON object:
{
  "optimizedSummary": "New professional summary tailored to this job",
  "optimizedExperience": [
    {
      "company": "Company Name",
      "title": "Job Title",
      "dates": "Date Range",
      "bullets": ["Achievement 1 with metrics", "Achievement 2"]
    }
  ],
  "optimizedSkills": ["skill1", "skill2", "skill3"],
  "atsAnalysis": {
    "score": 85,
    "keywordsMatched": ["keywords found in optimized resume"],
    "keywordsMissing": ["keywords that couldn't be truthfully added"],
    "suggestions": ["Additional improvements to consider"]
  }
}

CRITICAL: Only include skills and experience the candidate actually has. Enhance presentation, never fabricate.`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse optimized resume');
    }

    const result = JSON.parse(jsonMatch[0]);

    // Generate full text version
    const fullText = this.generateFullResumeText(result);

    return {
      ...result,
      fullOptimizedText: fullText,
    };
  }

  /**
   * Generate a cover letter for a job
   */
  static async generateCoverLetter(
    resumeText: string,
    jobDescription: string,
    jobTitle: string,
    company: string,
    tone: 'professional' | 'enthusiastic' | 'formal' = 'professional'
  ): Promise<CoverLetterResult> {
    const toneInstructions = {
      professional:
        'Write in a confident, professional tone that demonstrates competence and genuine interest.',
      enthusiastic:
        'Write with energy and excitement while remaining professional. Show passion for the opportunity.',
      formal:
        'Write in a traditional, formal business letter style appropriate for conservative industries.',
    };

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: RECRUITER_PERSONA,
      messages: [
        {
          role: 'user',
          content: `Write a compelling cover letter for this job application.

JOB DETAILS:
Title: ${jobTitle}
Company: ${company}
Description: ${jobDescription}

CANDIDATE'S RESUME:
${resumeText}

TONE: ${toneInstructions[tone]}

INSTRUCTIONS:
1. Open with a hook that shows knowledge of the company
2. Connect specific experience to job requirements
3. Highlight 2-3 key achievements that are most relevant
4. Show enthusiasm without being generic
5. Include a clear call to action
6. Keep it to 3-4 paragraphs (under 400 words)

Return a JSON object:
{
  "content": "Full cover letter text",
  "keyPoints": ["Main selling point 1", "Main selling point 2", "Main selling point 3"]
}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse cover letter');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Analyze ATS compatibility of a resume against a job
   */
  static async analyzeATS(
    resumeText: string,
    jobDescription: string
  ): Promise<{
    score: number;
    matched: string[];
    missing: string[];
    suggestions: string[];
    formatIssues: string[];
  }> {
    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2000,
      system: RECRUITER_PERSONA,
      messages: [
        {
          role: 'user',
          content: `Perform an ATS (Applicant Tracking System) compatibility analysis.

JOB DESCRIPTION:
${jobDescription}

RESUME:
${resumeText}

Analyze:
1. Keyword match rate (what % of job keywords appear in resume)
2. Exact phrase matches vs. semantic matches
3. Format issues that might confuse ATS parsers
4. Missing critical keywords
5. Skill alignment

Return JSON:
{
  "score": 0-100,
  "matched": ["keywords/phrases found in both"],
  "missing": ["critical keywords not in resume"],
  "suggestions": ["specific improvements to increase score"],
  "formatIssues": ["any formatting problems for ATS"]
}`,
        },
      ],
    });

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse ATS analysis');
    }

    return JSON.parse(jsonMatch[0]);
  }

  /**
   * Generate plain text resume from structured data
   */
  private static generateFullResumeText(data: {
    optimizedSummary: string;
    optimizedExperience: {
      company: string;
      title: string;
      dates: string;
      bullets: string[];
    }[];
    optimizedSkills: string[];
  }): string {
    let text = '';

    // Summary
    text += 'PROFESSIONAL SUMMARY\n';
    text += '─'.repeat(50) + '\n';
    text += data.optimizedSummary + '\n\n';

    // Skills
    text += 'SKILLS\n';
    text += '─'.repeat(50) + '\n';
    text += data.optimizedSkills.join(' • ') + '\n\n';

    // Experience
    text += 'PROFESSIONAL EXPERIENCE\n';
    text += '─'.repeat(50) + '\n';

    for (const exp of data.optimizedExperience) {
      text += `${exp.title}\n`;
      text += `${exp.company} | ${exp.dates}\n`;
      for (const bullet of exp.bullets) {
        text += `• ${bullet}\n`;
      }
      text += '\n';
    }

    return text;
  }

  /**
   * Save optimized resume to database
   */
  static async saveOptimizedResume(
    userId: string,
    resumeId: string,
    favoriteJobId: string,
    result: OptimizedResumeResult
  ) {
    return prisma.optimizedResume.upsert({
      where: {
        resumeId_favoriteJobId: {
          resumeId,
          favoriteJobId,
        },
      },
      update: {
        optimizedSummary: result.optimizedSummary,
        optimizedExperience: JSON.stringify(result.optimizedExperience),
        optimizedSkills: JSON.stringify(result.optimizedSkills),
        fullOptimizedText: result.fullOptimizedText,
        atsScore: result.atsAnalysis.score,
        keywordsMatched: JSON.stringify(result.atsAnalysis.keywordsMatched),
        keywordsMissing: JSON.stringify(result.atsAnalysis.keywordsMissing),
        suggestions: JSON.stringify(result.atsAnalysis.suggestions),
        aiModel: AI_MODEL,
        promptVersion: 'v1',
      },
      create: {
        userId,
        resumeId,
        favoriteJobId,
        optimizedSummary: result.optimizedSummary,
        optimizedExperience: JSON.stringify(result.optimizedExperience),
        optimizedSkills: JSON.stringify(result.optimizedSkills),
        fullOptimizedText: result.fullOptimizedText,
        atsScore: result.atsAnalysis.score,
        keywordsMatched: JSON.stringify(result.atsAnalysis.keywordsMatched),
        keywordsMissing: JSON.stringify(result.atsAnalysis.keywordsMissing),
        suggestions: JSON.stringify(result.atsAnalysis.suggestions),
        aiModel: AI_MODEL,
        promptVersion: 'v1',
      },
    });
  }

  /**
   * Save cover letter to database
   */
  static async saveCoverLetter(
    userId: string,
    favoriteJobId: string,
    resumeId: string | null,
    content: string,
    tone: string
  ) {
    return prisma.coverLetter.create({
      data: {
        userId,
        favoriteJobId,
        resumeId,
        content,
        tone,
        aiModel: AI_MODEL,
      },
    });
  }
}

export default AIResumeOptimizer;
