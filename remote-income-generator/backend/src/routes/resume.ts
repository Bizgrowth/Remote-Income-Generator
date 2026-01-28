import { Router, Request, Response } from 'express';
import multer from 'multer';
import prisma from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import { parseResume } from '../services/pdfParser';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for resume uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/resumes');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
    }
  },
});

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/resumes
 * Get all resumes for the current user
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const resumes = await prisma.resume.findMany({
      where: { userId: req.user!.userId },
      select: {
        id: true,
        name: true,
        fileName: true,
        isPrimary: true,
        createdAt: true,
        updatedAt: true,
        skills: true,
        summary: true,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });

    // Parse JSON fields
    const parsed = resumes.map((r) => ({
      ...r,
      skills: r.skills ? JSON.parse(r.skills) : [],
    }));

    res.json({ resumes: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get resumes';
    res.status(500).json({ error: message });
  }
});

/**
 * POST /api/resumes/upload
 * Upload and parse a new resume
 */
router.post('/upload', upload.single('resume'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { name, isPrimary } = req.body;
    const resumeName = name || 'My Resume';

    // Parse the resume to extract text and skills
    const parseResult = await parseResume(req.file.path);

    // Read file as binary for storage
    const fileBuffer = fs.readFileSync(req.file.path);

    // If setting as primary, unset other primaries
    if (isPrimary === 'true' || isPrimary === true) {
      await prisma.resume.updateMany({
        where: { userId: req.user!.userId },
        data: { isPrimary: false },
      });
    }

    // Check if this is the first resume (auto-set as primary)
    const existingCount = await prisma.resume.count({
      where: { userId: req.user!.userId },
    });
    const shouldBePrimary = existingCount === 0 || isPrimary === 'true' || isPrimary === true;

    // Create resume record
    const resume = await prisma.resume.create({
      data: {
        userId: req.user!.userId,
        name: resumeName,
        originalText: parseResult.text,
        originalFile: fileBuffer,
        fileName: req.file.originalname,
        skills: JSON.stringify(parseResult.skills),
        isPrimary: shouldBePrimary,
      },
    });

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Resume uploaded successfully',
      resume: {
        id: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        isPrimary: resume.isPrimary,
        skills: parseResult.skills,
        experienceLevel: parseResult.experienceLevel,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    const message = error instanceof Error ? error.message : 'Failed to upload resume';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/resumes/:id
 * Get a single resume with full details
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({
      resume: {
        id: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        originalText: resume.originalText,
        contactInfo: resume.contactInfo ? JSON.parse(resume.contactInfo) : null,
        summary: resume.summary,
        experience: resume.experience ? JSON.parse(resume.experience) : [],
        education: resume.education ? JSON.parse(resume.education) : [],
        skills: resume.skills ? JSON.parse(resume.skills) : [],
        certifications: resume.certifications ? JSON.parse(resume.certifications) : [],
        isPrimary: resume.isPrimary,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get resume';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/resumes/:id/download
 * Download the original resume file
 */
router.get('/:id/download', async (req: Request, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      select: {
        originalFile: true,
        fileName: true,
      },
    });

    if (!resume || !resume.originalFile) {
      return res.status(404).json({ error: 'Resume file not found' });
    }

    const ext = path.extname(resume.fileName || 'resume.pdf').toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
    };

    res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${resume.fileName}"`);
    res.send(Buffer.from(resume.originalFile));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to download resume';
    res.status(500).json({ error: message });
  }
});

/**
 * PATCH /api/resumes/:id
 * Update resume metadata
 */
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { name, isPrimary, summary, contactInfo, experience, education, skills, certifications } =
      req.body;

    // If setting as primary, unset other primaries first
    if (isPrimary === true) {
      await prisma.resume.updateMany({
        where: { userId: req.user!.userId },
        data: { isPrimary: false },
      });
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (isPrimary !== undefined) updateData.isPrimary = isPrimary;
    if (summary !== undefined) updateData.summary = summary;
    if (contactInfo !== undefined) updateData.contactInfo = JSON.stringify(contactInfo);
    if (experience !== undefined) updateData.experience = JSON.stringify(experience);
    if (education !== undefined) updateData.education = JSON.stringify(education);
    if (skills !== undefined) updateData.skills = JSON.stringify(skills);
    if (certifications !== undefined) updateData.certifications = JSON.stringify(certifications);

    const result = await prisma.resume.updateMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      data: updateData,
    });

    if (result.count === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const updated = await prisma.resume.findUnique({
      where: { id: req.params.id },
    });

    res.json({
      message: 'Resume updated',
      resume: {
        ...updated,
        skills: updated?.skills ? JSON.parse(updated.skills) : [],
        contactInfo: updated?.contactInfo ? JSON.parse(updated.contactInfo) : null,
        experience: updated?.experience ? JSON.parse(updated.experience) : [],
        education: updated?.education ? JSON.parse(updated.education) : [],
        certifications: updated?.certifications ? JSON.parse(updated.certifications) : [],
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update resume';
    res.status(500).json({ error: message });
  }
});

/**
 * DELETE /api/resumes/:id
 * Delete a resume
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const deleted = await prisma.resume.deleteMany({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    res.json({ message: 'Resume deleted' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to delete resume';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/resumes/primary
 * Get the user's primary resume
 */
router.get('/primary/current', async (req: Request, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: {
        userId: req.user!.userId,
        isPrimary: true,
      },
    });

    if (!resume) {
      return res.status(404).json({ error: 'No primary resume set' });
    }

    res.json({
      resume: {
        id: resume.id,
        name: resume.name,
        fileName: resume.fileName,
        originalText: resume.originalText,
        summary: resume.summary,
        skills: resume.skills ? JSON.parse(resume.skills) : [],
        isPrimary: resume.isPrimary,
        createdAt: resume.createdAt,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get primary resume';
    res.status(500).json({ error: message });
  }
});

export default router;
