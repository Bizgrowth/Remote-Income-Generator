import { BaseScraper } from './base';
import { Job } from '../types';
import * as cheerio from 'cheerio';

export class IndeedScraper extends BaseScraper {
  name = 'Indeed';
  baseUrl = 'https://www.indeed.com';

  async scrape(keywords?: string[]): Promise<Job[]> {
    try {
      // Search queries for AI/remote jobs
      const searches = [
        'q=ai+remote&l=Remote',
        'q=prompt+engineer+remote&l=Remote',
        'q=automation+specialist+remote&l=Remote',
        'q=content+writer+remote&l=Remote',
        'q=virtual+assistant+remote&l=Remote',
      ];

      const allJobs: Job[] = [];

      for (const search of searches.slice(0, 2)) {
        try {
          // Indeed blocks scrapers aggressively, so we use their mobile site
          const url = `${this.baseUrl}/jobs?${search}&fromage=7&remotejob=1`;

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
              'Accept': 'text/html,application/xhtml+xml',
            }
          });

          if (!response.ok) {
            console.log(`Indeed returned ${response.status}, skipping...`);
            continue;
          }

          const html = await response.text();
          const $ = cheerio.load(html);

          // Try multiple selectors as Indeed changes their HTML frequently
          const jobCards = $('[data-jk], .job_seen_beacon, .jobsearch-ResultsList > li');

          jobCards.each((_, element) => {
            const $el = $(element);

            const title = $el.find('.jobTitle span, h2.jobTitle, a[data-jk]').first().text().trim();
            const company = $el.find('.companyName, .company, [data-testid="company-name"]').first().text().trim();
            const location = $el.find('.companyLocation, .location').first().text().trim();
            const salary = $el.find('.salary-snippet, .metadata.salary-snippet-container').first().text().trim();

            const jobKey = $el.attr('data-jk') || $el.find('a[data-jk]').attr('data-jk');
            const href = jobKey ? `${this.baseUrl}/viewjob?jk=${jobKey}` :
                        $el.find('a').first().attr('href');

            if (!title || !href) return;

            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;

            const job: Job = {
              id: this.generateId('indeed', jobKey || href),
              title: title,
              company: company || 'Company',
              source: this.name,
              url: fullUrl,
              description: `${title} at ${company}. ${location}`,
              skills: this.extractSkillsFromText(title),
              salary: salary,
              posted: new Date(),
              remote: location.toLowerCase().includes('remote') || true
            };

            // Filter by keywords if provided
            if (keywords && keywords.length > 0) {
              const searchText = `${title} ${company}`.toLowerCase();
              if (!keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
                return;
              }
            }

            allJobs.push(job);
          });
        } catch (err) {
          console.error(`Indeed search error: ${search}`, err);
        }
      }

      // Remove duplicates
      const seen = new Set<string>();
      return allJobs.filter(job => {
        if (seen.has(job.url)) return false;
        seen.add(job.url);
        return true;
      }).slice(0, 25);
    } catch (error) {
      console.error('Indeed scraper error:', error);
      return [];
    }
  }
}
