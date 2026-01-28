import { BaseScraper } from './base';
import { Job } from '../types';

export class RemoteOKScraper extends BaseScraper {
  name = 'RemoteOK';
  baseUrl = 'https://remoteok.com';

  async scrape(keywords?: string[]): Promise<Job[]> {
    try {
      // RemoteOK has a public JSON API
      const response = await fetch(`${this.baseUrl}/api`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
        }
      });
      if (!response.ok) {
        console.error(`RemoteOK API error: ${response.status}`);
        return [];
      }

      const data = await response.json();

      // First item is legal notice, skip it
      const jobsData = Array.isArray(data) ? data.slice(1) : [];

      const jobs: Job[] = jobsData
        .filter((job: any) => {
          if (!keywords || keywords.length === 0) return true;

          const searchText = `${job.position || ''} ${job.company || ''} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
          return keywords.some(kw => searchText.includes(kw.toLowerCase()));
        })
        .slice(0, 50)
        .map((job: any) => ({
          id: this.generateId('remoteok', job.id || job.slug || Math.random().toString()),
          title: job.position || 'Unknown Position',
          company: job.company || 'Unknown Company',
          source: this.name,
          url: job.url || `${this.baseUrl}/remote-jobs/${job.slug}`,
          description: this.cleanDescription(job.description || ''),
          skills: job.tags || this.extractSkillsFromText(`${job.position} ${job.description}`),
          salary: this.formatSalary(job.salary_min, job.salary_max),
          posted: job.date ? new Date(job.date) : new Date(),
          remote: true
        }));

      return jobs;
    } catch (error) {
      console.error('RemoteOK scraper error:', error);
      return [];
    }
  }

  private cleanDescription(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 500);
  }

  private formatSalary(min?: number, max?: number): string {
    if (!min && !max) return '';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return '';
  }
}
