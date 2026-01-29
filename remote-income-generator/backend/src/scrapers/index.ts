import { Job, ScraperResult } from '../types';
import { getCuratedPlatformJobs, SKILL_DISPLAY_NAMES, SEARCH_PLATFORMS, STATIC_PLATFORMS } from './curatedPlatforms';

// Live scrapers disabled - major job sites block bot requests with 403 errors
// All platforms now use curated search URLs that users click to search directly

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

  // Map skills to curated platform keys
  const curatedSkillKeys = skills && skills.length > 0
    ? mapSkillsToCuratedKeys(skills)
    : undefined;

  console.log(`Getting curated platform jobs for: ${curatedSkillKeys?.join(', ') || 'all categories'}...`);

  // Get curated platform jobs (search URLs + static platform signups)
  const curatedJobs = getCuratedPlatformJobs(curatedSkillKeys);
  console.log(`Curated platforms: found ${curatedJobs.length} job links`);

  // Group results by source for reporting
  const sourceGroups = new Map<string, Job[]>();
  for (const job of curatedJobs) {
    const existing = sourceGroups.get(job.source) || [];
    existing.push(job);
    sourceGroups.set(job.source, existing);
  }

  // Create results for each source
  for (const [source, jobs] of sourceGroups) {
    results.push({
      jobs,
      source,
      scrapedAt: new Date()
    });
  }

  // Sort by posted date and limit
  const sortedJobs = curatedJobs
    .sort((a, b) => b.posted.getTime() - a.posted.getTime())
    .slice(0, limit);

  return { jobs: sortedJobs, results };
}

export async function scrapeSource(
  sourceName: string,
  skills?: string[]
): Promise<Job[]> {
  // Get all curated jobs and filter by source
  const curatedSkillKeys = skills && skills.length > 0
    ? mapSkillsToCuratedKeys(skills)
    : undefined;

  const allJobs = getCuratedPlatformJobs(curatedSkillKeys);
  return allJobs.filter(job => job.source.toLowerCase() === sourceName.toLowerCase());
}

export function getAvailableSources(): string[] {
  // Return all available sources: search platforms + static platform categories
  const searchPlatformNames = SEARCH_PLATFORMS.map(p => p.name);
  const categories = [...new Set(STATIC_PLATFORMS.map(p => p.category))];
  return [...searchPlatformNames, ...categories];
}
