import fs from 'fs';
import path from 'path';
import { Job, UserProfile } from '../types';

interface Database {
  jobs: Job[];
  profile: UserProfile;
}

const dbPath = path.join(__dirname, '../../data/db.json');

let db: Database;

function loadDatabase(): Database {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading database:', error);
  }

  // Return default database
  return {
    jobs: [],
    profile: {
      id: 'default',
      skills: [],
      experience: '',
      preferredCategories: []
    }
  };
}

function saveDatabase(): void {
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

export function initDatabase(): void {
  db = loadDatabase();
  console.log(`Database loaded: ${db.jobs.length} jobs, ${db.profile.skills.length} skills`);
}

export function saveJobs(jobs: Job[]): void {
  // Merge new jobs with existing, avoiding duplicates
  const existingIds = new Set(db.jobs.map(j => j.id));

  for (const job of jobs) {
    if (!existingIds.has(job.id)) {
      db.jobs.push(job);
      existingIds.add(job.id);
    } else {
      // Update existing job
      const index = db.jobs.findIndex(j => j.id === job.id);
      if (index !== -1) {
        db.jobs[index] = job;
      }
    }
  }

  // Keep only last 500 jobs
  if (db.jobs.length > 500) {
    db.jobs = db.jobs
      .sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime())
      .slice(0, 500);
  }

  saveDatabase();
}

export function getJobs(limit = 100, offset = 0): Job[] {
  return db.jobs
    .sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime())
    .slice(offset, offset + limit)
    .map(job => ({
      ...job,
      posted: new Date(job.posted)
    }));
}

export function searchJobs(keywords: string[], limit = 25): Job[] {
  if (keywords.length === 0) {
    return getJobs(limit);
  }

  const lowerKeywords = keywords.map(k => k.toLowerCase());

  const filtered = db.jobs.filter(job => {
    const searchText = `${job.title} ${job.description} ${job.skills.join(' ')}`.toLowerCase();
    return lowerKeywords.some(kw => searchText.includes(kw));
  });

  return filtered
    .sort((a, b) => new Date(b.posted).getTime() - new Date(a.posted).getTime())
    .slice(0, limit)
    .map(job => ({
      ...job,
      posted: new Date(job.posted)
    }));
}

export function getProfile(): UserProfile {
  return { ...db.profile };
}

export function saveProfile(profile: Partial<UserProfile>): void {
  db.profile = {
    ...db.profile,
    ...profile
  };
  saveDatabase();
}

export function clearOldJobs(daysOld = 30): void {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);

  db.jobs = db.jobs.filter(job => new Date(job.posted) >= cutoff);
  saveDatabase();
}

export function getDb(): Database {
  return db;
}
