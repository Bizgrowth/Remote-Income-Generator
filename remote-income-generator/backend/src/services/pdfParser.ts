import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs';
import { SKILL_KEYWORDS } from '../types';

export interface ParsedDocument {
  text: string;
  extractedSkills: string[];
  experienceLevel?: string;
}

/**
 * Sanitize text to remove null bytes and other characters that PostgreSQL doesn't support
 * in TEXT columns
 */
function sanitizeText(text: string): string {
  if (!text) return '';

  // Remove null bytes (0x00) and other control characters except newlines/tabs
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove other control chars except \n \r \t
    .trim();
}

export async function parsePDF(filePath: string): Promise<ParsedDocument> {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdf(dataBuffer);

  const text = sanitizeText(data.text);
  const extractedSkills = extractSkillsFromText(text);
  const experienceLevel = detectExperienceLevel(text);

  return {
    text,
    extractedSkills,
    experienceLevel
  };
}

export function extractSkillsFromText(text: string): string[] {
  const lowerText = text.toLowerCase();
  const matchedCategories: string[] = [];

  Object.entries(SKILL_KEYWORDS).forEach(([category, keywords]) => {
    const hasMatch = keywords.some(keyword =>
      lowerText.includes(keyword.toLowerCase())
    );
    if (hasMatch) {
      matchedCategories.push(category);
    }
  });

  return matchedCategories;
}

function detectExperienceLevel(text: string): string {
  const lowerText = text.toLowerCase();

  // Look for years of experience
  const yearsMatch = lowerText.match(/(\d+)\+?\s*years?\s*(of)?\s*(experience|exp)/);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[1], 10);
    if (years >= 10) return 'Senior/Expert';
    if (years >= 5) return 'Mid-Senior';
    if (years >= 2) return 'Mid-Level';
    return 'Entry-Level';
  }

  // Look for level keywords
  if (lowerText.includes('senior') || lowerText.includes('lead') || lowerText.includes('principal')) {
    return 'Senior';
  }
  if (lowerText.includes('junior') || lowerText.includes('entry') || lowerText.includes('intern')) {
    return 'Entry-Level';
  }

  return 'Not specified';
}

export async function parseTextDocument(filePath: string): Promise<ParsedDocument> {
  const rawText = fs.readFileSync(filePath, 'utf-8');
  const text = sanitizeText(rawText);
  const extractedSkills = extractSkillsFromText(text);
  const experienceLevel = detectExperienceLevel(text);

  return {
    text,
    extractedSkills,
    experienceLevel
  };
}

export async function parseDOCX(filePath: string): Promise<ParsedDocument> {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    const text = sanitizeText(result.value);
    const extractedSkills = extractSkillsFromText(text);
    const experienceLevel = detectExperienceLevel(text);

    return {
      text,
      extractedSkills,
      experienceLevel
    };
  } catch (error) {
    console.error('DOCX parsing error:', error);
    throw new Error('Failed to parse DOCX file');
  }
}

export interface ResumeParseResult {
  text: string;
  skills: string[];
  experienceLevel: string;
}

/**
 * Parse a resume file (PDF, DOC, DOCX, or TXT)
 * Returns extracted text, skills, and experience level
 */
export async function parseResume(filePath: string): Promise<ResumeParseResult> {
  const ext = filePath.toLowerCase().split('.').pop();

  let result: ParsedDocument;

  if (ext === 'pdf') {
    result = await parsePDF(filePath);
  } else if (ext === 'txt') {
    result = await parseTextDocument(filePath);
  } else if (ext === 'docx') {
    // Use mammoth for proper DOCX parsing
    try {
      result = await parseDOCX(filePath);
    } catch {
      result = {
        text: '[Unable to parse DOCX - please try PDF or TXT format]',
        extractedSkills: [],
        experienceLevel: 'Not specified',
      };
    }
  } else if (ext === 'doc') {
    // Legacy .doc format not supported - recommend conversion
    result = {
      text: '[DOC format not supported - please convert to DOCX or PDF]',
      extractedSkills: [],
      experienceLevel: 'Not specified',
    };
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  return {
    text: result.text,
    skills: result.extractedSkills,
    experienceLevel: result.experienceLevel || 'Not specified',
  };
}
