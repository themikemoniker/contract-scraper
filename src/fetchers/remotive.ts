import type { JobListing, RemotiveJob } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const REMOTIVE_API = 'https://remotive.com/api/remote-jobs?category=software-dev&limit=50';

interface RemotiveResponse {
  jobs: RemotiveJob[];
  'job-count': number;
}

function parseRemotiveJob(job: RemotiveJob): JobListing {
  // Clean HTML from description
  const description = job.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const techStack = extractTechStack(description + ' ' + job.title);
  const experienceLevel = detectExperienceLevel(description + ' ' + job.title);

  // Map job_type to contract type
  let contractType = detectContractType(job.job_type);
  if (!contractType) {
    // Fallback mapping based on job_type field
    if (job.job_type === 'full_time') {
      contractType = 'full-time';
    } else if (job.job_type === 'contract') {
      contractType = 'contract';
    } else if (job.job_type === 'freelance') {
      contractType = 'freelance';
    }
  }

  // Parse salary string if available
  let salaryMin: number | null = null;
  let salaryMax: number | null = null;
  let salaryCurrency: string | null = 'USD';

  if (job.salary) {
    // Try to extract numbers from salary string (e.g., "$100,000 - $150,000")
    const salaryNumbers = job.salary.match(/[\d,]+/g);
    if (salaryNumbers && salaryNumbers.length >= 1) {
      salaryMin = parseInt(salaryNumbers[0].replace(/,/g, ''), 10);
      if (salaryNumbers.length >= 2) {
        salaryMax = parseInt(salaryNumbers[1].replace(/,/g, ''), 10);
      }
    }

    // Detect currency from salary string
    if (job.salary.includes('EUR') || job.salary.includes('\u20ac')) {
      salaryCurrency = 'EUR';
    } else if (job.salary.includes('GBP') || job.salary.includes('\u00a3')) {
      salaryCurrency = 'GBP';
    }
  }

  // Determine remote type from location
  const locationLower = (job.candidate_required_location || '').toLowerCase();
  let remoteType: 'remote' | 'hybrid' | 'onsite' | null = 'remote';
  if (locationLower.includes('hybrid')) {
    remoteType = 'hybrid';
  } else if (locationLower.includes('onsite') || locationLower.includes('on-site')) {
    remoteType = 'onsite';
  }

  return {
    id: `remotive:${job.id}`,
    platform: 'remotive',
    external_id: String(job.id),
    title: job.title,
    company: job.company_name,
    description,
    url: job.url,

    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: salaryCurrency,
    salary_type: 'yearly',

    contract_type: contractType,
    experience_level: experienceLevel,

    location: job.candidate_required_location || null,
    remote_type: remoteType,
    timezone: null,

    tech_stack: techStack,
    tags: job.tags ?? [],

    posted_at: job.publication_date,
    fetched_at: new Date().toISOString(),

    raw: job as unknown as Record<string, unknown>,
  };
}

export async function fetchRemotiveJobs(): Promise<JobListing[]> {
  console.log('[Remotive] Fetching jobs...');

  const response = await fetch(REMOTIVE_API);
  if (!response.ok) {
    throw new Error(`Remotive API failed: ${response.status}`);
  }

  const data = (await response.json()) as RemotiveResponse;

  if (!data.jobs || !Array.isArray(data.jobs)) {
    console.log('[Remotive] No jobs returned');
    return [];
  }

  console.log(`[Remotive] Received ${data.jobs.length} jobs (total count: ${data['job-count']})`);

  const jobs = data.jobs.map(parseRemotiveJob);

  console.log(`[Remotive] Parsed ${jobs.length} jobs`);
  return jobs;
}
