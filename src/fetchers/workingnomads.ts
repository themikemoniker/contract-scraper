import type { JobListing, WorkingNomadsJob } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const WORKINGNOMADS_API = 'https://www.workingnomads.com/api/exposed_jobs/';

// Tech-related category names to filter for
const TECH_CATEGORIES = [
  'development',
  'devops',
  'data',
  'design',
  'engineering',
  'software',
  'programming',
  'web',
  'mobile',
  'frontend',
  'backend',
  'fullstack',
  'sysadmin',
];

function extractUrlSlug(url: string): string {
  // Extract the last part of the URL path as the slug
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/').filter(Boolean);
    return pathParts[pathParts.length - 1] || url;
  } catch {
    // If URL parsing fails, use the full URL
    return url.replace(/[^a-zA-Z0-9-]/g, '-');
  }
}

function isTechCategory(categoryName: string): boolean {
  const lowerCategory = categoryName.toLowerCase();
  return TECH_CATEGORIES.some(tech => lowerCategory.includes(tech));
}

function parseWorkingNomadsJob(job: WorkingNomadsJob): JobListing {
  // Clean HTML from description
  const description = job.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Parse tags from comma-separated string
  const tags = job.tags
    ? job.tags.split(',').map(tag => tag.trim()).filter(Boolean)
    : [];

  const techStack = extractTechStack(description + ' ' + job.title + ' ' + tags.join(' '));
  const experienceLevel = detectExperienceLevel(description + ' ' + job.title);
  const contractType = detectContractType(description);

  // Detect remote type from location
  const locationLower = job.location.toLowerCase();
  let remoteType: 'remote' | 'hybrid' | 'onsite' | null = 'remote';
  if (locationLower.includes('hybrid')) {
    remoteType = 'hybrid';
  } else if (locationLower.includes('onsite') || locationLower.includes('on-site')) {
    remoteType = 'onsite';
  }

  const urlSlug = extractUrlSlug(job.url);

  return {
    id: `workingnomads:${urlSlug}`,
    platform: 'workingnomads',
    external_id: urlSlug,
    title: job.title,
    company: job.company_name || null,
    description,
    url: job.url,

    salary_min: null,
    salary_max: null,
    salary_currency: null,
    salary_type: null,

    contract_type: contractType,
    experience_level: experienceLevel,

    location: job.location || null,
    remote_type: remoteType,
    timezone: null,

    tech_stack: techStack,
    tags: [job.category_name, ...tags].filter(Boolean),

    posted_at: job.pub_date || null,
    fetched_at: new Date().toISOString(),

    raw: job as unknown as Record<string, unknown>,
  };
}

export async function fetchWorkingNomadsJobs(): Promise<JobListing[]> {
  console.log('[WorkingNomads] Fetching jobs...');

  const response = await fetch(WORKINGNOMADS_API);
  if (!response.ok) {
    throw new Error(`WorkingNomads API failed: ${response.status}`);
  }

  const data = (await response.json()) as WorkingNomadsJob[];

  if (!Array.isArray(data)) {
    console.log('[WorkingNomads] No jobs returned');
    return [];
  }

  console.log(`[WorkingNomads] Received ${data.length} jobs`);

  // Filter for tech-related categories
  const techJobs = data.filter(job => isTechCategory(job.category_name));
  console.log(`[WorkingNomads] Filtered to ${techJobs.length} tech jobs`);

  const jobs = techJobs.map(parseWorkingNomadsJob);

  console.log(`[WorkingNomads] Parsed ${jobs.length} jobs`);
  return jobs;
}
