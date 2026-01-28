import { BaseScraper } from './base';
import { Job } from '../types';
import * as cheerio from 'cheerio';

export class WeWorkRemotelyScraper extends BaseScraper {
  name = 'WeWorkRemotely';
  baseUrl = 'https://weworkremotely.com';

  async scrape(keywords?: string[]): Promise<Job[]> {
    try {
      // Fetch the main job listing pages
      const categories = [
        '/remote-jobs/search?term=ai',
        '/remote-jobs/search?term=automation',
        '/remote-jobs/search?term=content',
        '/remote-jobs/search?term=marketing',
        '/categories/remote-programming-jobs',
        '/categories/remote-customer-support-jobs',
        '/categories/remote-marketing-jobs'
      ];

      const allJobs: Job[] = [];

      for (const category of categories.slice(0, 3)) {
        try {
          const response = await fetch(`${this.baseUrl}${category}`);
          if (!response.ok) continue;

          const html = await response.text();
          const $ = cheerio.load(html);

          $('li.feature, li.new-listing').each((_, element) => {
            const $el = $(element);
            const $link = $el.find('a').first();
            const href = $link.attr('href');

            if (!href || href.includes('categories')) return;

            const title = $el.find('.title').text().trim() ||
                          $el.find('span.company').next().text().trim();
            const company = $el.find('.company').text().trim() ||
                            $el.find('span.company').text().trim();
            const region = $el.find('.region').text().trim();

            if (!title) return;

            const fullUrl = href.startsWith('http') ? href : `${this.baseUrl}${href}`;

            const job: Job = {
              id: this.generateId('wwr', href),
              title: title,
              company: company,
              source: this.name,
              url: fullUrl,
              description: `${title} at ${company}. ${region}`,
              skills: this.extractSkillsFromText(`${title} ${company}`),
              posted: new Date(),
              remote: true
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
          console.error(`WWR category error: ${category}`, err);
        }
      }

      // Remove duplicates
      const seen = new Set<string>();
      return allJobs.filter(job => {
        if (seen.has(job.url)) return false;
        seen.add(job.url);
        return true;
      }).slice(0, 30);
    } catch (error) {
      console.error('WWR scraper error:', error);
      return [];
    }
  }
}
