import { Job, UserProfile, SKILL_KEYWORDS } from '../types';

export function matchJobsToProfile(jobs: Job[], profile: UserProfile): Job[] {
  const userKeywords = extractUserKeywords(profile);

  return jobs.map(job => {
    const { score, reasons } = calculateMatchScore(job, userKeywords, profile);
    return {
      ...job,
      matchScore: score,
      matchReasons: reasons
    };
  }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
}

function extractUserKeywords(profile: UserProfile): string[] {
  const keywords: string[] = [];

  // Add keywords from selected skill categories
  profile.skills.forEach(skill => {
    const categoryKeywords = SKILL_KEYWORDS[skill];
    if (categoryKeywords) {
      keywords.push(...categoryKeywords);
    }
  });

  // Add keywords from preferred categories
  profile.preferredCategories.forEach(cat => {
    const catKeywords = SKILL_KEYWORDS[cat];
    if (catKeywords) {
      keywords.push(...catKeywords);
    }
  });

  return [...new Set(keywords.map(k => k.toLowerCase()))];
}

function calculateMatchScore(
  job: Job,
  userKeywords: string[],
  profile: UserProfile
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  const maxScore = 100;

  const jobText = `${job.title} ${job.description} ${job.skills.join(' ')}`.toLowerCase();

  // Keyword matches (up to 60 points)
  const matchedKeywords: string[] = [];
  userKeywords.forEach(keyword => {
    if (jobText.includes(keyword)) {
      matchedKeywords.push(keyword);
    }
  });

  if (matchedKeywords.length > 0) {
    const keywordScore = Math.min(60, matchedKeywords.length * 10);
    score += keywordScore;

    // Get unique top keywords for reasons
    const uniqueMatches = [...new Set(matchedKeywords)].slice(0, 3);
    reasons.push(`Matches skills: ${uniqueMatches.join(', ')}`);
  }

  // Remote job bonus (10 points)
  if (job.remote) {
    score += 10;
    reasons.push('Remote position');
  }

  // Recency bonus (up to 15 points)
  const daysSincePosted = getDaysSince(job.posted);
  if (daysSincePosted <= 1) {
    score += 15;
    reasons.push('Posted today');
  } else if (daysSincePosted <= 3) {
    score += 10;
    reasons.push('Posted recently');
  } else if (daysSincePosted <= 7) {
    score += 5;
    reasons.push('Posted this week');
  }

  // Salary match bonus (up to 15 points)
  if (job.salary && profile.minHourlyRate) {
    const salaryNum = extractSalaryNumber(job.salary);
    if (salaryNum && salaryNum >= profile.minHourlyRate) {
      score += 15;
      reasons.push(`Meets rate: ${job.salary}`);
    }
  }

  return {
    score: Math.min(score, maxScore),
    reasons
  };
}

function getDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function extractSalaryNumber(salary: string): number | null {
  const match = salary.match(/\$?(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

export function generateJobSummary(job: Job): string {
  const parts: string[] = [];

  // Title and company
  parts.push(`${job.title}${job.company ? ` at ${job.company}` : ''}`);

  // Key info
  if (job.salary) parts.push(`Pay: ${job.salary}`);
  if (job.remote) parts.push('Remote');

  // Top skills
  if (job.skills.length > 0) {
    parts.push(`Skills: ${job.skills.slice(0, 3).join(', ')}`);
  }

  // Match info
  if (job.matchScore !== undefined) {
    parts.push(`Match: ${job.matchScore}%`);
  }

  if (job.matchReasons && job.matchReasons.length > 0) {
    parts.push(`Why: ${job.matchReasons.slice(0, 2).join('; ')}`);
  }

  return parts.join(' | ');
}
