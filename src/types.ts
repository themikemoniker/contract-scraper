// Common job listing schema used across all sources
export interface JobListing {
  id: string; // Generated: platform:external_id
  platform: string;
  external_id: string;
  title: string;
  company: string | null;
  description: string | null;
  url: string;

  // Compensation
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string | null;
  salary_type: 'hourly' | 'yearly' | 'fixed' | null;

  // Job details
  contract_type: 'full-time' | 'part-time' | 'contract' | 'freelance' | null;
  experience_level: 'junior' | 'mid' | 'senior' | 'lead' | null;

  // Location
  location: string | null;
  remote_type: 'remote' | 'hybrid' | 'onsite' | null;
  timezone: string | null;

  // Extracted/enriched data
  tech_stack: string[];
  tags: string[];

  // Metadata
  posted_at: string | null;
  fetched_at: string;

  // Original payload
  raw: Record<string, unknown>;
}

// Input type for creating new listings
export type JobListingInput = Omit<JobListing, 'id' | 'fetched_at'>;

// Source-specific raw types
export interface HNItem {
  id: number;
  created_at: string;
  author: string;
  text: string;
  parent_id: number;
  story_id: number;
}

export interface JobicyJob {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
}

export interface HimalayasJob {
  id: string;
  title: string;
  excerpt: string;
  companyName: string;
  companyLogo: string;
  url: string;
  applicationUrl: string;
  employmentType: string;
  locationRestrictions: string[];
  timezoneRestrictions: string[];
  categories: string[];
  publishedAt: string;
  minSalary?: number;
  maxSalary?: number;
  salaryCurrency?: string;
}

export interface WWRJob {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  company: string;
  region: string;
}

// Analytics types
export interface AnalyticsData {
  totalJobs: number;
  bySource: Record<string, number>;
  byTechStack: Record<string, number>;
  byContractType: Record<string, number>;
  byRemoteType: Record<string, number>;
  bySalaryRange: {
    under50k: number;
    '50k-100k': number;
    '100k-150k': number;
    '150k-200k': number;
    over200k: number;
    unknown: number;
  };
  lastUpdated: string;
  jobsLast7Days: number[];
}

// Deduplication result
export interface DedupeResult {
  unique: JobListing[];
  duplicates: Array<{
    kept: JobListing;
    removed: JobListing[];
  }>;
  stats: {
    totalInput: number;
    totalUnique: number;
    totalDuplicates: number;
  };
}
