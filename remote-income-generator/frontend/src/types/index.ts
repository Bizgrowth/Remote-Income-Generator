export interface Job {
  id: string;
  title: string;
  company: string;
  source: string;
  url: string;
  description: string;
  skills: string[];
  salary?: string;
  posted: string;
  remote: boolean;
  matchScore?: number;
  matchReasons?: string[];
  summary?: string;
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
  sources?: string[];
  sortBy?: 'recent' | 'match' | 'salary';
  limit?: number;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  fetchedAt: string;
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
