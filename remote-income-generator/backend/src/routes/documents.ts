import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { parsePDF, parseTextDocument } from '../services/pdfParser';
import { getProfile, saveProfile } from '../services/database';

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: PDF, TXT, DOC, DOCX'));
    }
  }
});

// Upload and parse document
router.post('/upload', upload.single('document'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const ext = path.extname(req.file.originalname).toLowerCase();

    let parsed;
    if (ext === '.pdf') {
      parsed = await parsePDF(filePath);
    } else if (ext === '.txt') {
      parsed = await parseTextDocument(filePath);
    } else {
      // For doc/docx, treat as text (basic support)
      parsed = await parseTextDocument(filePath);
    }

    // Update profile with extracted skills
    const profile = getProfile();
    const newSkills = [...new Set([...profile.skills, ...parsed.extractedSkills])];

    saveProfile({
      ...profile,
      skills: newSkills,
      experience: parsed.experienceLevel || profile.experience
    });

    res.json({
      message: 'Document parsed successfully',
      filename: req.file.originalname,
      extractedSkills: parsed.extractedSkills,
      experienceLevel: parsed.experienceLevel,
      preview: parsed.text.slice(0, 500) + '...',
      updatedProfile: getProfile()
    });
  } catch (error) {
    console.error('Error parsing document:', error);
    res.status(500).json({ error: 'Failed to parse document' });
  }
});

// List uploaded documents
router.get('/', (req: Request, res: Response) => {
  try {
    if (!fs.existsSync(uploadDir)) {
      return res.json({ documents: [] });
    }

    const files = fs.readdirSync(uploadDir).map(filename => {
      const filePath = path.join(uploadDir, filename);
      const stats = fs.statSync(filePath);
      return {
        filename,
        size: stats.size,
        uploadedAt: stats.mtime
      };
    });

    res.json({ documents: files });
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

// Delete a document
router.delete('/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Document not found' });
    }

    fs.unlinkSync(filePath);
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
