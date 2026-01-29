import { Job } from '../types';

// All 25 skill categories with their search terms
const SKILL_SEARCHES: Record<string, string[]> = {
  // AI & Automation
  'ai_automation': ['AI automation', 'machine learning', 'AI engineer', 'artificial intelligence'],
  'ai_prompt_engineering': ['prompt engineer', 'prompt engineering', 'LLM engineer', 'AI prompts'],
  'ai_training_rlhf': ['AI training', 'data labeling', 'RLHF', 'AI annotation', 'machine learning data'],
  'ai_content_moderation': ['content moderation', 'AI moderation', 'trust and safety', 'content review'],
  'custom_gpt_development': ['GPT developer', 'custom GPT', 'chatbot developer', 'AI assistant developer'],
  'nocode_ai_consulting': ['no-code automation', 'Zapier expert', 'Make.com', 'n8n automation', 'workflow automation'],

  // Content & Media
  'ai_copywriting_seo': ['AI copywriter', 'SEO content writer', 'AI content', 'copywriting'],
  'video_script_writing': ['video script writer', 'YouTube scriptwriter', 'TikTok content', 'video content'],
  'podcast_production': ['podcast editor', 'podcast producer', 'audio editing', 'podcast production'],
  'ugc_creation': ['UGC creator', 'user generated content', 'content creator', 'social media content'],
  'social_media_management': ['social media manager', 'community manager', 'social media marketing'],

  // Testing & Research
  'user_testing': ['user testing', 'usability testing', 'UX research', 'website tester'],
  'beta_testing_qa': ['QA tester', 'beta tester', 'software testing', 'quality assurance'],
  'search_evaluation': ['search evaluator', 'search quality', 'ads evaluator', 'search engine evaluation'],
  'market_research': ['market research', 'research participant', 'survey taker', 'focus group'],
  'competitive_intelligence': ['competitive intelligence', 'market analyst', 'business intelligence', 'competitor research'],

  // Tech & Tools
  'crm_management': ['HubSpot admin', 'Salesforce admin', 'CRM specialist', 'CRM manager'],
  'webflow_framer': ['Webflow developer', 'Framer developer', 'no-code website', 'Webflow designer'],
  'notion_airtable': ['Notion consultant', 'Airtable expert', 'Notion template', 'workspace design'],
  'api_integration': ['API integration', 'Zapier integration', 'no-code integration', 'automation specialist'],
  'spreadsheet_automation': ['Excel automation', 'Google Sheets', 'spreadsheet expert', 'dashboard builder'],

  // Advisory & Consulting
  'fractional_coo': ['fractional COO', 'operations consultant', 'startup operations', 'COO consultant'],
  'process_documentation': ['process documentation', 'SOP writer', 'business process', 'documentation specialist'],
  'executive_coaching': ['executive coach', 'business coach', 'leadership coach', 'career coach'],
  'pitch_deck_creation': ['pitch deck', 'investor presentation', 'startup pitch', 'presentation designer'],
  'course_creation': ['course creator', 'online course', 'course development', 'e-learning developer'],

  // Management & Operations
  'product_project_manager': ['product manager', 'project manager', 'scrum master', 'agile coach', 'product owner'],
  'digital_marketing_manager': ['digital marketing manager', 'marketing manager', 'growth marketing', 'performance marketing'],
  'customer_support_success': ['customer support', 'customer success manager', 'support specialist', 'client success'],
  'telehealth_healthcare': ['telehealth', 'remote healthcare', 'telemedicine', 'health coach', 'medical remote'],
};

// Platforms that support job search URLs
interface PlatformConfig {
  name: string;
  baseUrl: string;
  searchFormat: (query: string) => string;
}

const SEARCH_PLATFORMS: PlatformConfig[] = [
  {
    name: 'Upwork',
    baseUrl: 'https://www.upwork.com',
    searchFormat: (q) => `https://www.upwork.com/nx/search/jobs/?q=${encodeURIComponent(q)}&sort=recency`,
  },
  {
    name: 'WeWorkRemotely',
    baseUrl: 'https://weworkremotely.com',
    searchFormat: (q) => `https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(q)}`,
  },
  {
    name: 'RemoteOK',
    baseUrl: 'https://remoteok.com',
    searchFormat: (q) => `https://remoteok.com/remote-jobs/${encodeURIComponent(q.toLowerCase().replace(/\s+/g, '-'))}`,
  },
  {
    name: 'Indeed',
    baseUrl: 'https://www.indeed.com',
    searchFormat: (q) => `https://www.indeed.com/jobs?q=${encodeURIComponent(q)}&l=Remote&remotejob=032b3046-06a3-4876-8dfd-474eb5e7ed11`,
  },
  {
    name: 'LinkedIn',
    baseUrl: 'https://www.linkedin.com',
    searchFormat: (q) => `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(q)}&f_WT=2`,
  },
  {
    name: 'FlexJobs',
    baseUrl: 'https://www.flexjobs.com',
    searchFormat: (q) => `https://www.flexjobs.com/search?search=${encodeURIComponent(q)}&location=Remote`,
  },
  {
    name: 'Remote.co',
    baseUrl: 'https://remote.co',
    searchFormat: (q) => `https://remote.co/remote-jobs/search/?search_keywords=${encodeURIComponent(q)}`,
  },
  {
    name: 'BuiltIn',
    baseUrl: 'https://builtin.com',
    searchFormat: (q) => `https://builtin.com/jobs/remote?search=${encodeURIComponent(q)}`,
  },
];

// Static platforms (signup pages, not search-based)
interface StaticPlatform {
  title: string;
  url: string;
  category: string;
  description: string;
  skills: string[];
}

const STATIC_PLATFORMS: StaticPlatform[] = [
  // User Testing Platforms
  { title: 'UserTesting - Get Paid to Test', url: 'https://www.usertesting.com/get-paid-to-test', category: 'Testing & Research', description: 'Get paid $4-$120 per test to review websites and apps', skills: ['user testing', 'ux research', 'feedback'] },
  { title: 'Testbirds - Become a Tester', url: 'https://www.testbirds.com/en/become-a-tester/', category: 'Testing & Research', description: 'Crowdtesting platform for websites and apps', skills: ['testing', 'qa', 'bug reporting'] },
  { title: 'Trymata - Tester Signup', url: 'https://www.trymata.com/tester/signup', category: 'Testing & Research', description: 'User testing platform paying $5-$30 per test', skills: ['user testing', 'usability', 'feedback'] },
  { title: 'Userlytics - Tester Panel', url: 'https://www.userlytics.com/tester/', category: 'Testing & Research', description: 'Remote usability testing opportunities', skills: ['usability testing', 'ux', 'research'] },
  { title: 'TestingTime - Paid Research', url: 'https://www.testingtime.com/en/become-a-test-user/', category: 'Testing & Research', description: 'Participate in paid user research studies', skills: ['user research', 'testing', 'feedback'] },
  { title: 'PlaybookUX - Tester Signup', url: 'https://www.playbookux.com/tester/', category: 'Testing & Research', description: 'UX research platform for testers', skills: ['ux research', 'testing', 'usability'] },
  { title: 'dScout - Be a Scout', url: 'https://dscout.com/be-a-scout', category: 'Testing & Research', description: 'Mobile research missions paying $10-$100+', skills: ['research', 'mobile testing', 'feedback'] },
  { title: 'Lyssna (UsabilityHub) Panel', url: 'https://www.lyssna.com/panel/', category: 'Testing & Research', description: 'Quick design surveys and tests', skills: ['design feedback', 'surveys', 'testing'] },

  // AI Training & Data Platforms
  { title: 'Appen - AI Contributor', url: 'https://appen.com/join-our-crowd/', category: 'AI & Automation', description: 'AI training data, annotation, and evaluation tasks', skills: ['ai training', 'data labeling', 'rlhf', 'annotation'] },
  { title: 'Remotasks - AI Tasks', url: 'https://www.remotasks.com/en', category: 'AI & Automation', description: 'AI training tasks including RLHF and data labeling', skills: ['ai training', 'data labeling', 'tasks'] },
  { title: 'Scale AI - Remoter Workers', url: 'https://scale.com/careers#remote', category: 'AI & Automation', description: 'AI data labeling and training opportunities', skills: ['ai training', 'data annotation', 'labeling'] },
  { title: 'Toloka - AI Training', url: 'https://toloka.ai/tolokers/', category: 'AI & Automation', description: 'Crowdsourced AI training tasks', skills: ['ai training', 'data tasks', 'annotation'] },
  { title: 'DataAnnotation.tech', url: 'https://www.dataannotation.tech/', category: 'AI & Automation', description: 'AI training and RLHF opportunities', skills: ['rlhf', 'ai training', 'data annotation'] },
  { title: 'Outlier AI', url: 'https://outlier.ai/', category: 'AI & Automation', description: 'AI training for coding and writing tasks', skills: ['ai training', 'coding', 'writing', 'rlhf'] },

  // Expert Networks (GLG-style)
  { title: 'GLG Expert Council Member', url: 'https://glginsights.com/council-members/', category: 'Advisory & Consulting', description: 'Paid expert consultations $100-500+/hour', skills: ['consulting', 'expert', 'advisory'] },
  { title: 'AlphaSights Strategic Advisor', url: 'https://www.alphasights.com/become-an-advisor/', category: 'Advisory & Consulting', description: 'Expert network for industry consultations', skills: ['consulting', 'advisory', 'expert'] },
  { title: 'Guidepoint Knowledge Advisor', url: 'https://www.guidepoint.com/become-an-advisor/', category: 'Advisory & Consulting', description: 'Share expertise with investors and companies', skills: ['consulting', 'advisory', 'research'] },
  { title: 'Dialectica Expert Advisor', url: 'https://dialectica.com/become-an-expert/', category: 'Advisory & Consulting', description: 'Expert consultations for business insights', skills: ['consulting', 'expert', 'advisory'] },
  { title: 'Techspert.io - Expert Network', url: 'https://www.techspert.io/become-an-expert', category: 'Advisory & Consulting', description: 'Technical expert consultations', skills: ['consulting', 'technical', 'expert'] },
  { title: 'NewtonX Expert Network', url: 'https://www.newtonx.com/become-an-expert/', category: 'Advisory & Consulting', description: 'B2B expert knowledge marketplace', skills: ['consulting', 'b2b', 'expert'] },

  // Freelance Marketplaces (general links)
  { title: 'Fiverr - Become a Seller', url: 'https://www.fiverr.com/start_selling', category: 'Freelance', description: 'Sell services in AI, automation, content, and more', skills: ['freelance', 'gigs', 'services'] },
  { title: 'Toptal - Apply as Freelancer', url: 'https://www.toptal.com/freelance-jobs', category: 'Freelance', description: 'Top 3% freelance talent network', skills: ['freelance', 'expert', 'consulting'] },
  { title: 'Contra - Join as Independent', url: 'https://contra.com/', category: 'Freelance', description: 'Commission-free freelance platform', skills: ['freelance', 'independent', 'projects'] },
];

// Skill category to human-readable name mapping
const SKILL_DISPLAY_NAMES: Record<string, string> = {
  'ai_automation': 'AI & Automation',
  'ai_prompt_engineering': 'AI Prompt Engineering & Optimization',
  'ai_training_rlhf': 'AI Training Data Labeling & RLHF',
  'ai_content_moderation': 'AI-Powered Content Moderation',
  'custom_gpt_development': 'Custom GPT/Assistant Development',
  'nocode_ai_consulting': 'No-Code AI Automation Consulting',
  'ai_copywriting_seo': 'AI-Assisted Copywriting & SEO Content',
  'video_script_writing': 'Video Script Writing for YouTube/TikTok',
  'podcast_production': 'Podcast Production & Editing',
  'ugc_creation': 'UGC (User-Generated Content) Creation',
  'social_media_management': 'Social Media Community Management',
  'user_testing': 'Website & App User Testing',
  'beta_testing_qa': 'Beta Testing & QA for Software',
  'search_evaluation': 'Search Engine Evaluation',
  'market_research': 'Market Research Participant',
  'competitive_intelligence': 'Competitive Intelligence Research',
  'crm_management': 'CRM Setup & Management (HubSpot/Salesforce)',
  'webflow_framer': 'Webflow/Framer Website Development',
  'notion_airtable': 'Notion/Airtable Workspace Design',
  'api_integration': 'API Integration Specialist (No-Code Focus)',
  'spreadsheet_automation': 'Spreadsheet Automation & Dashboard Building',
  'fractional_coo': 'Fractional COO for Startups',
  'process_documentation': 'Business Process Documentation',
  'executive_coaching': 'Executive Coaching (Remote Sessions)',
  'pitch_deck_creation': 'Pitch Deck & Investor Presentation Creation',
  'course_creation': 'Online Course Creation & Launch Consulting',
  'product_project_manager': 'Product / Project Manager',
  'digital_marketing_manager': 'Digital Marketing Manager',
  'customer_support_success': 'Customer Support / Success',
  'telehealth_healthcare': 'Telehealth / Remote Healthcare',
};

export interface CuratedJob extends Job {
  category: string;
  searchQuery?: string;
}

export function getCuratedPlatformJobs(selectedSkills?: string[]): CuratedJob[] {
  const jobs: CuratedJob[] = [];
  const now = new Date();
  let idCounter = 1;

  // Determine which skill categories to include
  const skillsToSearch = selectedSkills && selectedSkills.length > 0
    ? selectedSkills
    : Object.keys(SKILL_SEARCHES);

  // Generate search URL jobs for each selected skill category
  for (const skillKey of skillsToSearch) {
    const searchTerms = SKILL_SEARCHES[skillKey];
    if (!searchTerms) continue;

    const categoryName = SKILL_DISPLAY_NAMES[skillKey] || skillKey;
    const primarySearchTerm = searchTerms[0];

    // Create a job entry for each platform with this search
    for (const platform of SEARCH_PLATFORMS) {
      const searchUrl = platform.searchFormat(primarySearchTerm);

      jobs.push({
        id: `curated-${idCounter++}`,
        title: `${primarySearchTerm} Jobs`,
        company: platform.name,
        source: platform.name,
        url: searchUrl,
        description: `Search for ${categoryName} opportunities on ${platform.name}. Click to view current listings.`,
        skills: searchTerms.slice(0, 4),
        posted: new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random within last 7 days
        remote: true,
        category: categoryName,
        searchQuery: primarySearchTerm,
      });
    }
  }

  // Add relevant static platforms based on selected skills
  for (const platform of STATIC_PLATFORMS) {
    // Check if this platform is relevant to any selected skill
    const isRelevant = !selectedSkills || selectedSkills.length === 0 ||
      selectedSkills.some(skill => {
        const skillName = SKILL_DISPLAY_NAMES[skill]?.toLowerCase() || skill.toLowerCase();
        return platform.category.toLowerCase().includes(skillName.split(' ')[0]) ||
               platform.skills.some(s => skillName.includes(s));
      });

    if (isRelevant) {
      jobs.push({
        id: `static-${idCounter++}`,
        title: platform.title,
        company: 'Platform',
        source: platform.category,  // Use category as source for filtering
        url: platform.url,
        description: platform.description,
        skills: platform.skills,
        posted: new Date(now.getTime() - Math.random() * 14 * 24 * 60 * 60 * 1000),
        remote: true,
        category: platform.category,
      });
    }
  }

  return jobs;
}

// Get all available skill categories
export function getSkillCategories(): { key: string; name: string }[] {
  return Object.entries(SKILL_DISPLAY_NAMES).map(([key, name]) => ({
    key,
    name,
  }));
}

// Export for use in main scraper
export { SKILL_SEARCHES, SEARCH_PLATFORMS, STATIC_PLATFORMS, SKILL_DISPLAY_NAMES };
