import type { JobListing, RemoteOKJob } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const REMOTEOK_API = 'https://remoteok.com/api';

function parseRemoteOKJob(job: RemoteOKJob): JobListing {
  // Clean HTML from description
  const description = job.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const techStack = extractTechStack(description + ' ' + job.position + ' ' + job.tags.join(' '));
  const experienceLevel = detectExperienceLevel(description + ' ' + job.position);
  const contractType = detectContractType(description + ' ' + job.position);

  // Normalize salary - RemoteOK provides annual salary
  let salaryMin = job.salary_min ?? null;
  let salaryMax = job.salary_max ?? null;

  // Detect remote type from location
  const locationLower = (job.location || '').toLowerCase();
  let remoteType: 'remote' | 'hybrid' | 'onsite' | null = 'remote';
  if (locationLower.includes('hybrid')) {
    remoteType = 'hybrid';
  } else if (locationLower.includes('onsite') || locationLower.includes('on-site')) {
    remoteType = 'onsite';
  }

  return {
    id: `remoteok:${job.id}`,
    platform: 'remoteok',
    external_id: String(job.id),
    title: job.position,
    company: job.company,
    description,
    url: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,

    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: 'USD',
    salary_type: 'yearly',

    contract_type: contractType,
    experience_level: experienceLevel,

    location: job.location,
    remote_type: remoteType,
    timezone: null,

    tech_stack: techStack,
    tags: job.tags ?? [],

    posted_at: job.date,
    fetched_at: new Date().toISOString(),

    raw: job as unknown as Record<string, unknown>,
  };
}

export async function fetchRemoteOKJobs(): Promise<JobListing[]> {
  console.log('[RemoteOK] Fetching jobs...');

  const response = await fetch(REMOTEOK_API, {
    headers: {
      'User-Agent': 'contract-scraper/1.0',
    },
  });

  if (!response.ok) {
    throw new Error(`RemoteOK API failed: ${response.status}`);
  }

  const data = (await response.json()) as RemoteOKJob[];

  // First element is metadata, skip it
  const jobs = data.slice(1);

  if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
    console.log('[RemoteOK] No jobs returned');
    return [];
  }

  console.log(`[RemoteOK] Received ${jobs.length} jobs`);

  const parsedJobs = jobs.map(parseRemoteOKJob);

  console.log(`[RemoteOK] Parsed ${parsedJobs.length} jobs`);
  return parsedJobs;
}
