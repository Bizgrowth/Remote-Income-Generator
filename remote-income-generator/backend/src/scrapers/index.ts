import { Job, ScraperResult, SKILL_KEYWORDS } from '../types';
import { RemoteOKScraper } from './remoteok';
import { WeWorkRemotelyScraper } from './weworkremotely';
import { UpworkScraper } from './upwork';
import { IndeedScraper } from './indeed';
import { getCuratedPlatformJobs, SKILL_DISPLAY_NAMES } from './curatedPlatforms';

const scrapers = [
  new RemoteOKScraper(),
  new WeWorkRemotelyScraper(),
  new UpworkScraper(),
  new IndeedScraper(),
];

// Map frontend skill names to curated platform skill keys
function mapSkillsToCuratedKeys(skills: string[]): string[] {
  const reverseMap: Record<string, string> = {};

  // Create reverse mapping from display name to key
  for (const [key, displayName] of Object.entries(SKILL_DISPLAY_NAMES)) {
    reverseMap[displayName.toLowerCase()] = key;
    // Also map partial matches
    reverseMap[displayName.split(' ')[0].toLowerCase()] = key;
  }

  // Also map the original SKILL_KEYWORDS categories
  const skillKeywordMap: Record<string, string> = {
    'ai_automation': 'ai_automation',
    'prompt_engineering': 'ai_prompt_engineering',
    'ai_training': 'ai_training_rlhf',
    'content_moderation': 'ai_content_moderation',
    'gpt_development': 'custom_gpt_development',
    'nocode_automation': 'nocode_ai_consulting',
    'ai_copywriting': 'ai_copywriting_seo',
    'video_scripts': 'video_script_writing',
    'podcast_editing': 'podcast_production',
    'ugc_content': 'ugc_creation',
    'community_management': 'social_media_management',
    'user_testing': 'user_testing',
    'qa_testing': 'beta_testing_qa',
    'search_evaluation': 'search_evaluation',
    'market_research': 'market_research',
    'competitive_research': 'competitive_intelligence',
    'crm_admin': 'crm_management',
    'webflow_development': 'webflow_framer',
    'notion_design': 'notion_airtable',
    'api_integration': 'api_integration',
    'spreadsheet_automation': 'spreadsheet_automation',
    'fractional_executive': 'fractional_coo',
    'process_docs': 'process_documentation',
    'executive_coaching': 'executive_coaching',
    'pitch_decks': 'pitch_deck_creation',
    'course_creation': 'course_creation',
    'product_manager': 'product_project_manager',
    'project_manager': 'product_project_manager',
    'digital_marketing': 'digital_marketing_manager',
    'customer_support': 'customer_support_success',
    'customer_success': 'customer_support_success',
    'telehealth': 'telehealth_healthcare',
    'healthcare': 'telehealth_healthcare',
  };

  const mapped: string[] = [];
  for (const skill of skills) {
    const lowerSkill = skill.toLowerCase();
    if (skillKeywordMap[lowerSkill]) {
      mapped.push(skillKeywordMap[lowerSkill]);
    } else if (reverseMap[lowerSkill]) {
      mapped.push(reverseMap[lowerSkill]);
    } else {
      // Try partial match
      for (const [key, curatedKey] of Object.entries(skillKeywordMap)) {
        if (lowerSkill.includes(key.split('_')[0]) || key.includes(lowerSkill.split('_')[0])) {
          mapped.push(curatedKey);
          break;
        }
      }
    }
  }

  return [...new Set(mapped)];
}

export async function scrapeAllSources(
  skills?: string[],
  limit = 50
): Promise<{ jobs: Job[]; results: ScraperResult[] }> {
  const results: ScraperResult[] = [];
  const allJobs: Job[] = [];

  // Map skills to curated platform keys
  const curatedSkillKeys = skills && skills.length > 0
    ? mapSkillsToCuratedKeys(skills)
    : undefined;

  console.log(`Getting curated platform jobs for: ${curatedSkillKeys?.join(', ') || 'all categories'}...`);

  // Always get curated platform jobs first (these always work!)
  const curatedJobs = getCuratedPlatformJobs(curatedSkillKeys);
  console.log(`Curated platforms: found ${curatedJobs.length} job links`);

  allJobs.push(...curatedJobs);
  results.push({
    jobs: curatedJobs,
    source: 'Curated Platforms',
    scrapedAt: new Date()
  });

  // Also try the live scrapers (may or may not work depending on IP)
  const keywords = skills && skills.length > 0
    ? extractKeywordsFromSkills(skills)
    : [];

  if (keywords.length > 0) {
    console.log(`Also trying live scrapers with keywords: ${keywords.slice(0, 5).join(', ')}...`);

    const scraperPromises = scrapers.map(async scraper => {
      try {
        console.log(`Starting ${scraper.name} scraper...`);
        const jobs = await scraper.scrape(keywords);
        console.log(`${scraper.name}: found ${jobs.length} jobs`);

        if (jobs.length > 0) {
          results.push({
            jobs,
            source: scraper.name,
            scrapedAt: new Date()
          });
          allJobs.push(...jobs);
        }
      } catch (error) {
        console.error(`Scraper ${scraper.name} failed:`, error);
      }
    });

    await Promise.all(scraperPromises);
  }

  // Sort by posted date and limit
  const sortedJobs = allJobs
    .sort((a, b) => b.posted.getTime() - a.posted.getTime())
    .slice(0, limit);

  return { jobs: sortedJobs, results };
}

export async function scrapeSource(
  sourceName: string,
  keywords?: string[]
): Promise<Job[]> {
  const scraper = scrapers.find(
    s => s.name.toLowerCase() === sourceName.toLowerCase()
  );

  if (!scraper) {
    throw new Error(`Unknown source: ${sourceName}`);
  }

  return scraper.scrape(keywords);
}

function extractKeywordsFromSkills(skills: string[]): string[] {
  const keywords: string[] = [];

  skills.forEach(skill => {
    const skillKeywords = SKILL_KEYWORDS[skill];
    if (skillKeywords) {
      // Take top 3 keywords from each skill category
      keywords.push(...skillKeywords.slice(0, 3));
    }
  });

  return [...new Set(keywords)];
}

export function getAvailableSources(): string[] {
  return scrapers.map(s => s.name);
}
