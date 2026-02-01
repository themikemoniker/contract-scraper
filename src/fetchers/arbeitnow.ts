import type { JobListing, ArbeitnowJob } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const ARBEITNOW_API = 'https://www.arbeitnow.com/api/job-board-api?remote=true';

interface ArbeitnowResponse {
  data: ArbeitnowJob[];
}

function parseArbeitnowJob(job: ArbeitnowJob): JobListing {
  // Clean HTML from description
  const description = job.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const techStack = extractTechStack(description + ' ' + job.title);
  const experienceLevel = detectExperienceLevel(description + ' ' + job.title);
  const contractType = detectContractType(job.job_types.join(' '));

  // Detect remote type
  let remoteType: 'remote' | 'hybrid' | 'onsite' | null = job.remote ? 'remote' : null;
  const locationLower = job.location.toLowerCase();
  if (locationLower.includes('hybrid')) {
    remoteType = 'hybrid';
  } else if (locationLower.includes('onsite') || locationLower.includes('on-site')) {
    remoteType = 'onsite';
  }

  // Convert Unix timestamp to ISO string
  const postedAt = job.created_at
    ? new Date(job.created_at * 1000).toISOString()
    : null;

  return {
    id: `arbeitnow:${job.slug}`,
    platform: 'arbeitnow',
    external_id: job.slug,
    title: job.title,
    company: job.company_name,
    description,
    url: job.url,

    salary_min: null,
    salary_max: null,
    salary_currency: null,
    salary_type: null,

    contract_type: contractType,
    experience_level: experienceLevel,

    location: job.location,
    remote_type: remoteType,
    timezone: null,

    tech_stack: techStack,
    tags: job.tags ?? [],

    posted_at: postedAt,
    fetched_at: new Date().toISOString(),

    raw: job as unknown as Record<string, unknown>,
  };
}

export async function fetchArbeitnowJobs(): Promise<JobListing[]> {
  console.log('[Arbeitnow] Fetching remote jobs...');

  const response = await fetch(ARBEITNOW_API);
  if (!response.ok) {
    throw new Error(`Arbeitnow API failed: ${response.status}`);
  }

  const data = (await response.json()) as ArbeitnowResponse;

  if (!data.data || !Array.isArray(data.data)) {
    console.log('[Arbeitnow] No jobs returned');
    return [];
  }

  console.log(`[Arbeitnow] Received ${data.data.length} jobs`);

  const jobs = data.data.map(parseArbeitnowJob);

  console.log(`[Arbeitnow] Parsed ${jobs.length} jobs`);
  return jobs;
}
