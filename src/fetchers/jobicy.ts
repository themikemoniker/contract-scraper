import type { JobListing, JobicyJob } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const JOBICY_API = 'https://jobicy.com/api/v2/remote-jobs';

interface JobicyResponse {
  jobs: JobicyJob[];
}

function parseJobicyJob(job: JobicyJob): JobListing {
  // Clean HTML from description
  const description = job.jobDescription
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const techStack = extractTechStack(description + ' ' + job.jobTitle);
  const experienceLevel = detectExperienceLevel(job.jobLevel + ' ' + description);
  const contractType = detectContractType(job.jobType.join(' '));

  // Normalize salary - Jobicy provides annual salary
  let salaryMin = job.annualSalaryMin ?? null;
  let salaryMax = job.annualSalaryMax ?? null;

  // Detect remote type from job geo
  const geoLower = job.jobGeo.toLowerCase();
  let remoteType: 'remote' | 'hybrid' | 'onsite' | null = 'remote';
  if (geoLower.includes('hybrid')) {
    remoteType = 'hybrid';
  } else if (geoLower.includes('onsite') || geoLower.includes('on-site')) {
    remoteType = 'onsite';
  }

  return {
    id: `jobicy:${job.id}`,
    platform: 'jobicy',
    external_id: String(job.id),
    title: job.jobTitle,
    company: job.companyName,
    description,
    url: job.url,

    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: job.salaryCurrency ?? 'USD',
    salary_type: 'yearly',

    contract_type: contractType,
    experience_level: experienceLevel,

    location: job.jobGeo,
    remote_type: remoteType,
    timezone: null,

    tech_stack: techStack,
    tags: job.jobIndustry ?? [],

    posted_at: job.pubDate,
    fetched_at: new Date().toISOString(),

    raw: job as unknown as Record<string, unknown>,
  };
}

export async function fetchJobicyJobs(count: number = 100): Promise<JobListing[]> {
  console.log(`[Jobicy] Fetching up to ${count} jobs...`);

  const url = `${JOBICY_API}?count=${count}&industry=engineering`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Jobicy API failed: ${response.status}`);
  }

  const data = (await response.json()) as JobicyResponse;

  if (!data.jobs || !Array.isArray(data.jobs)) {
    console.log('[Jobicy] No jobs returned');
    return [];
  }

  console.log(`[Jobicy] Received ${data.jobs.length} jobs`);

  const jobs = data.jobs.map(parseJobicyJob);

  console.log(`[Jobicy] Parsed ${jobs.length} jobs`);
  return jobs;
}
