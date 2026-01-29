import { BaseScraper } from './base';
import { Job } from '../types';

export class UpworkScraper extends BaseScraper {
  name = 'Upwork';
  baseUrl = 'https://www.upwork.com';

  // NOTE: Upwork discontinued their public RSS feed (410 Gone) in 2024
  // This scraper is disabled until an alternative method is available
  // Options: Upwork API (requires partner account) or manual job posting

  async scrape(_keywords?: string[]): Promise<Job[]> {
    // Upwork RSS feed is no longer available (returns 410 Gone)
    // Return empty array - jobs from other sources will still work
    console.log('Upwork: RSS feed discontinued. Skipping Upwork source.');
    return [];
  }
}
