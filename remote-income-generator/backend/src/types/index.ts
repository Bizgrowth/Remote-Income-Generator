export interface Job {
  id: string;
  title: string;
  company: string;
  source: string;
  url: string;
  description: string;
  skills: string[];
  salary?: string;
  posted: Date;
  remote: boolean;
  matchScore?: number;
  matchReasons?: string[];
}

export interface UserProfile {
  id: string;
  skills: string[];
  experience: string;
  minHourlyRate?: number;
  minProjectRate?: number;
  preferredCategories: string[];
}

export interface SearchFilters {
  skills?: string[];
  minSalary?: number;
  maxSalary?: number;
  sources?: string[];
  limit?: number;
  sortBy?: 'recent' | 'match' | 'salary';
}

export interface ScraperResult {
  jobs: Job[];
  source: string;
  scrapedAt: Date;
}

export const SKILL_CATEGORIES = [
  'AI & Automation',
  'AI Prompt Engineering & Optimization',
  'AI Training Data Labeling & RLHF',
  'AI-Powered Content Moderation',
  'Custom GPT/Assistant Development',
  'No-Code AI Automation Consulting',
  'AI-Assisted Copywriting & SEO Content',
  'Video Script Writing for YouTube/TikTok',
  'Podcast Production & Editing',
  'UGC (User-Generated Content) Creation',
  'Social Media Community Management',
  'Website & App User Testing',
  'Beta Testing & QA for Software',
  'Search Engine Evaluation',
  'Market Research Participant',
  'Competitive Intelligence Research',
  'CRM Setup & Management (HubSpot/Salesforce)',
  'Webflow/Framer Website Development',
  'Notion/Airtable Workspace Design',
  'API Integration Specialist (No-Code Focus)',
  'Spreadsheet Automation & Dashboard Building',
  'Fractional COO for Startups',
  'Business Process Documentation',
  'Executive Coaching (Remote Sessions)',
  'Pitch Deck & Investor Presentation Creation',
  'Online Course Creation & Launch Consulting',
  'Product / Project Manager',
  'Digital Marketing Manager',
  'Customer Support / Success',
  'Telehealth / Remote Healthcare'
];

export const SKILL_KEYWORDS: Record<string, string[]> = {
  'AI & Automation': ['ai', 'automation', 'artificial intelligence', 'machine learning', 'ml', 'ai engineer', 'ai developer'],
  'AI Prompt Engineering & Optimization': ['prompt', 'chatgpt', 'gpt', 'llm', 'ai', 'prompt engineering', 'claude', 'gemini'],
  'AI Training Data Labeling & RLHF': ['rlhf', 'data labeling', 'annotation', 'training data', 'ai training', 'labeling'],
  'AI-Powered Content Moderation': ['content moderation', 'moderation', 'trust safety', 'ai moderation'],
  'Custom GPT/Assistant Development': ['gpt', 'chatbot', 'assistant', 'custom gpt', 'ai assistant', 'bot development'],
  'No-Code AI Automation Consulting': ['no-code', 'zapier', 'make', 'automation', 'n8n', 'integromat', 'ai automation'],
  'AI-Assisted Copywriting & SEO Content': ['copywriting', 'seo', 'content writing', 'blog', 'ai writing', 'copy'],
  'Video Script Writing for YouTube/TikTok': ['video script', 'youtube', 'tiktok', 'script writing', 'content creator'],
  'Podcast Production & Editing': ['podcast', 'audio editing', 'audio production', 'podcast editing'],
  'UGC (User-Generated Content) Creation': ['ugc', 'user generated', 'content creator', 'social content'],
  'Social Media Community Management': ['social media', 'community', 'community manager', 'social management'],
  'Website & App User Testing': ['user testing', 'ux testing', 'usability', 'user research', 'testing'],
  'Beta Testing & QA for Software': ['qa', 'quality assurance', 'beta testing', 'software testing', 'bug testing'],
  'Search Engine Evaluation': ['search evaluation', 'search quality', 'seo evaluation', 'rater'],
  'Market Research Participant': ['market research', 'survey', 'research participant', 'focus group'],
  'Competitive Intelligence Research': ['competitive intelligence', 'competitor analysis', 'market intelligence', 'research'],
  'CRM Setup & Management (HubSpot/Salesforce)': ['crm', 'hubspot', 'salesforce', 'customer relationship', 'crm setup'],
  'Webflow/Framer Website Development': ['webflow', 'framer', 'web development', 'website builder', 'no-code web'],
  'Notion/Airtable Workspace Design': ['notion', 'airtable', 'workspace', 'database design', 'productivity tools'],
  'API Integration Specialist (No-Code Focus)': ['api integration', 'api', 'integration', 'connector', 'webhook'],
  'Spreadsheet Automation & Dashboard Building': ['spreadsheet', 'excel', 'google sheets', 'dashboard', 'data visualization'],
  'Fractional COO for Startups': ['fractional', 'coo', 'operations', 'startup operations', 'chief operating'],
  'Business Process Documentation': ['documentation', 'process', 'sop', 'business process', 'workflow'],
  'Executive Coaching (Remote Sessions)': ['coaching', 'executive coaching', 'leadership', 'mentor', 'business coach'],
  'Pitch Deck & Investor Presentation Creation': ['pitch deck', 'investor', 'presentation', 'fundraising', 'startup pitch'],
  'Online Course Creation & Launch Consulting': ['course creation', 'online course', 'e-learning', 'course launch', 'teaching'],
  'Product / Project Manager': ['product manager', 'project manager', 'pm', 'scrum master', 'agile', 'product owner'],
  'Digital Marketing Manager': ['digital marketing', 'marketing manager', 'ppc', 'seo manager', 'growth marketing', 'performance marketing'],
  'Customer Support / Success': ['customer support', 'customer success', 'support specialist', 'client success', 'customer service', 'help desk'],
  'Telehealth / Remote Healthcare': ['telehealth', 'remote healthcare', 'telemedicine', 'health coach', 'medical', 'healthcare remote']
};
