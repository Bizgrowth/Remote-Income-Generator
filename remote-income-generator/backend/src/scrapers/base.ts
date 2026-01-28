import { Job, ScraperResult } from '../types';

export abstract class BaseScraper {
  abstract name: string;
  abstract baseUrl: string;

  abstract scrape(keywords?: string[]): Promise<Job[]>;

  protected generateId(source: string, identifier: string): string {
    return `${source}-${identifier}`.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  protected extractSkillsFromText(text: string): string[] {
    const skillPatterns = [
      /\b(ai|artificial intelligence|machine learning|ml)\b/gi,
      /\b(gpt|chatgpt|llm|claude|gemini)\b/gi,
      /\b(prompt engineering)\b/gi,
      /\b(python|javascript|typescript|nodejs|react)\b/gi,
      /\b(no-?code|zapier|make|n8n|automation)\b/gi,
      /\b(webflow|framer|notion|airtable)\b/gi,
      /\b(copywriting|seo|content writing)\b/gi,
      /\b(crm|hubspot|salesforce)\b/gi,
      /\b(podcast|video editing|youtube)\b/gi,
      /\b(qa|testing|quality assurance)\b/gi,
      /\b(ux|user testing|usability)\b/gi,
      /\b(data labeling|annotation|rlhf)\b/gi,
      /\b(api|integration|webhook)\b/gi,
      /\b(excel|spreadsheet|google sheets|dashboard)\b/gi,
      /\b(coaching|consulting|advisory)\b/gi,
    ];

    const skills: Set<string> = new Set();
    const lowerText = text.toLowerCase();

    skillPatterns.forEach(pattern => {
      const matches = lowerText.match(pattern);
      if (matches) {
        matches.forEach(m => skills.add(m.toLowerCase()));
      }
    });

    return Array.from(skills);
  }

  protected parseDate(dateStr: string): Date {
    const now = new Date();

    // Handle relative dates
    if (dateStr.includes('today') || dateStr.includes('just now') || dateStr.includes('hour')) {
      return now;
    }
    if (dateStr.includes('yesterday')) {
      return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const daysMatch = dateStr.match(/(\d+)\s*d(ay)?s?\s*ago/i);
    if (daysMatch) {
      return new Date(now.getTime() - parseInt(daysMatch[1]) * 24 * 60 * 60 * 1000);
    }

    const weeksMatch = dateStr.match(/(\d+)\s*w(eek)?s?\s*ago/i);
    if (weeksMatch) {
      return new Date(now.getTime() - parseInt(weeksMatch[1]) * 7 * 24 * 60 * 60 * 1000);
    }

    const monthsMatch = dateStr.match(/(\d+)\s*m(onth)?s?\s*ago/i);
    if (monthsMatch) {
      return new Date(now.getTime() - parseInt(monthsMatch[1]) * 30 * 24 * 60 * 60 * 1000);
    }

    // Try parsing as date string
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? now : parsed;
  }

  async getResult(keywords?: string[]): Promise<ScraperResult> {
    const jobs = await this.scrape(keywords);
    return {
      jobs,
      source: this.name,
      scrapedAt: new Date()
    };
  }
}
