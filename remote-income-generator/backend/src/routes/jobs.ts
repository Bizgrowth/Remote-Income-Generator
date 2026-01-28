import { Router, Request, Response } from 'express';
import { scrapeAllSources, getAvailableSources } from '../scrapers';
import { getJobs, searchJobs, saveJobs, getProfile } from '../services/database';
import { matchJobsToProfile, generateJobSummary } from '../services/matcher';
import { SearchFilters } from '../types';

const router = Router();

// Get recent jobs from database
router.get('/recent', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 25;
    const jobs = getJobs(limit);
    const profile = getProfile();

    const matchedJobs = matchJobsToProfile(jobs, profile);
    const jobsWithSummary = matchedJobs.map(job => ({
      ...job,
      summary: generateJobSummary(job)
    }));

    res.json({
      jobs: jobsWithSummary,
      total: jobsWithSummary.length,
      fetchedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting recent jobs:', error);
    res.status(500).json({ error: 'Failed to get recent jobs' });
  }
});

// Get top 25 matching jobs
router.get('/top', async (req: Request, res: Response) => {
  try {
    const jobs = getJobs(100);
    const profile = getProfile();

    const matchedJobs = matchJobsToProfile(jobs, profile)
      .slice(0, 25);

    const jobsWithSummary = matchedJobs.map(job => ({
      ...job,
      summary: generateJobSummary(job)
    }));

    res.json({
      jobs: jobsWithSummary,
      total: jobsWithSummary.length,
      fetchedAt: new Date()
    });
  } catch (error) {
    console.error('Error getting top jobs:', error);
    res.status(500).json({ error: 'Failed to get top jobs' });
  }
});

// Search jobs with filters
router.get('/search', async (req: Request, res: Response) => {
  try {
    const filters: SearchFilters = {
      skills: req.query.skills
        ? (req.query.skills as string).split(',')
        : undefined,
      minSalary: req.query.minSalary
        ? parseInt(req.query.minSalary as string)
        : undefined,
      sources: req.query.sources
        ? (req.query.sources as string).split(',')
        : undefined,
      limit: parseInt(req.query.limit as string) || 25,
      sortBy: (req.query.sortBy as 'recent' | 'match' | 'salary') || 'match'
    };

    const profile = getProfile();

    // Search with skill keywords
    const searchKeywords = filters.skills || profile.skills.slice(0, 5);
    const jobs = searchJobs(searchKeywords, filters.limit || 100);

    // Filter by source if specified
    let filteredJobs = filters.sources
      ? jobs.filter(job => filters.sources!.includes(job.source))
      : jobs;

    // Match and score
    const matchedJobs = matchJobsToProfile(filteredJobs, profile);

    // Sort based on preference
    let sortedJobs = matchedJobs;
    if (filters.sortBy === 'recent') {
      sortedJobs = matchedJobs.sort((a, b) => b.posted.getTime() - a.posted.getTime());
    } else if (filters.sortBy === 'salary') {
      sortedJobs = matchedJobs.sort((a, b) => {
        const salaryA = extractSalaryNumber(a.salary);
        const salaryB = extractSalaryNumber(b.salary);
        return salaryB - salaryA;
      });
    }
    // Default is already sorted by match score

    const finalJobs = sortedJobs.slice(0, filters.limit || 25);
    const jobsWithSummary = finalJobs.map(job => ({
      ...job,
      summary: generateJobSummary(job)
    }));

    res.json({
      jobs: jobsWithSummary,
      total: jobsWithSummary.length,
      filters,
      fetchedAt: new Date()
    });
  } catch (error) {
    console.error('Error searching jobs:', error);
    res.status(500).json({ error: 'Failed to search jobs' });
  }
});

// Refresh jobs from all sources
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const profile = getProfile();
    const skills = req.body.skills || profile.skills;

    console.log('Starting job refresh...');
    const { jobs, results } = await scrapeAllSources(skills, 50);

    // Save to database
    saveJobs(jobs);

    // Match and return
    const matchedJobs = matchJobsToProfile(jobs, profile);
    const jobsWithSummary = matchedJobs.slice(0, 25).map(job => ({
      ...job,
      summary: generateJobSummary(job)
    }));

    res.json({
      jobs: jobsWithSummary,
      total: jobs.length,
      sources: results.map(r => ({
        name: r.source,
        count: r.jobs.length,
        scrapedAt: r.scrapedAt
      })),
      message: `Fetched ${jobs.length} jobs from ${results.length} sources`
    });
  } catch (error) {
    console.error('Error refreshing jobs:', error);
    res.status(500).json({ error: 'Failed to refresh jobs' });
  }
});

// Get available sources
router.get('/sources', (req: Request, res: Response) => {
  res.json({
    sources: getAvailableSources()
  });
});

function extractSalaryNumber(salary?: string): number {
  if (!salary) return 0;
  const match = salary.match(/\$?(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

export default router;
