import { BaseScraper } from './base';
import { Job } from '../types';
import Parser from 'rss-parser';

export class UpworkScraper extends BaseScraper {
  name = 'Upwork';
  baseUrl = 'https://www.upwork.com';

  private parser = new Parser({
    customFields: {
      item: ['description', 'pubDate', 'link']
    }
  });

  async scrape(keywords?: string[]): Promise<Job[]> {
    try {
      // Upwork RSS feeds for different categories
      const feeds = [
        'https://www.upwork.com/ab/feed/jobs/rss?q=ai+prompt&sort=recency',
        'https://www.upwork.com/ab/feed/jobs/rss?q=chatgpt&sort=recency',
        'https://www.upwork.com/ab/feed/jobs/rss?q=automation&sort=recency',
        'https://www.upwork.com/ab/feed/jobs/rss?q=content+writing&sort=recency',
        'https://www.upwork.com/ab/feed/jobs/rss?q=no+code&sort=recency',
        'https://www.upwork.com/ab/feed/jobs/rss?q=virtual+assistant&sort=recency',
      ];

      const allJobs: Job[] = [];

      for (const feedUrl of feeds) {
        try {
          const feed = await this.parser.parseURL(feedUrl);

          for (const item of feed.items.slice(0, 15)) {
            const description = this.cleanDescription(item.description || item.content || '');
            const budget = this.extractBudget(description);

            const job: Job = {
              id: this.generateId('upwork', item.guid || item.link || Math.random().toString()),
              title: item.title || 'Untitled Project',
              company: 'Upwork Client',
              source: this.name,
              url: item.link || '',
              description: description,
              skills: this.extractSkillsFromText(`${item.title} ${description}`),
              salary: budget,
              posted: item.pubDate ? new Date(item.pubDate) : new Date(),
              remote: true
            };

            // Filter by keywords if provided
            if (keywords && keywords.length > 0) {
              const searchText = `${job.title} ${job.description}`.toLowerCase();
              if (!keywords.some(kw => searchText.includes(kw.toLowerCase()))) {
                continue;
              }
            }

            allJobs.push(job);
          }
        } catch (err) {
          console.error(`Upwork feed error: ${feedUrl}`, err);
        }
      }

      // Remove duplicates and limit
      const seen = new Set<string>();
      return allJobs.filter(job => {
        const key = `${job.title}-${job.url}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 40);
    } catch (error) {
      console.error('Upwork scraper error:', error);
      return [];
    }
  }

  private cleanDescription(html: string): string {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  }

  private extractBudget(text: string): string {
    // Look for budget patterns
    const hourlyMatch = text.match(/\$(\d+(?:\.\d{2})?)\s*[-–]\s*\$(\d+(?:\.\d{2})?)\s*(?:\/hr|hourly|per hour)/i);
    if (hourlyMatch) {
      return `$${hourlyMatch[1]} - $${hourlyMatch[2]}/hr`;
    }

    const fixedMatch = text.match(/Budget:\s*\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i);
    if (fixedMatch) {
      return `Fixed: $${fixedMatch[1]}`;
    }

    const rangeMatch = text.match(/\$(\d+(?:,\d{3})*)\s*[-–]\s*\$(\d+(?:,\d{3})*)/);
    if (rangeMatch) {
      return `$${rangeMatch[1]} - $${rangeMatch[2]}`;
    }

    return '';
  }
}
