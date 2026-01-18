import type { JobListing, HimalayasJob } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const HIMALAYAS_API = 'https://himalayas.app/jobs/api';
const MAX_PAGES = 10; // Limit to avoid hitting rate limits (20 per page = 200 jobs max)

interface HimalayasResponse {
  jobs: HimalayasJob[];
  totalCount: number;
}

function parseHimalayasJob(job: HimalayasJob): JobListing {
  const description = job.excerpt ?? '';
  const techStack = extractTechStack(description + ' ' + job.title);
  const experienceLevel = detectExperienceLevel(description);
  const contractType = detectContractType(job.employmentType);

  // Parse timezone restrictions
  const timezone = job.timezoneRestrictions?.length > 0
    ? job.timezoneRestrictions.join(', ')
    : null;

  // Determine remote type from employment type and location restrictions
  let remoteType: 'remote' | 'hybrid' | 'onsite' | null = 'remote';
  const empLower = job.employmentType?.toLowerCase() ?? '';
  if (empLower.includes('hybrid')) {
    remoteType = 'hybrid';
  } else if (empLower.includes('onsite') || empLower.includes('on-site')) {
    remoteType = 'onsite';
  }

  const location = job.locationRestrictions?.length > 0
    ? job.locationRestrictions.join(', ')
    : 'Worldwide';

  return {
    id: `himalayas:${job.id}`,
    platform: 'himalayas',
    external_id: job.id,
    title: job.title,
    company: job.companyName,
    description,
    url: job.url,

    salary_min: job.minSalary ?? null,
    salary_max: job.maxSalary ?? null,
    salary_currency: job.salaryCurrency ?? null,
    salary_type: job.minSalary ? 'yearly' : null,

    contract_type: contractType,
    experience_level: experienceLevel,

    location,
    remote_type: remoteType,
    timezone,

    tech_stack: techStack,
    tags: job.categories ?? [],

    posted_at: job.publishedAt,
    fetched_at: new Date().toISOString(),

    raw: job as unknown as Record<string, unknown>,
  };
}

export async function fetchHimalayasJobs(): Promise<JobListing[]> {
  console.log('[Himalayas] Fetching jobs...');

  const allJobs: JobListing[] = [];
  let offset = 0;
  const limit = 20; // Max allowed per request

  for (let page = 0; page < MAX_PAGES; page++) {
    const url = `${HIMALAYAS_API}?limit=${limit}&offset=${offset}`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 429) {
          console.log('[Himalayas] Rate limited, stopping pagination');
          break;
        }
        throw new Error(`Himalayas API failed: ${response.status}`);
      }

      const data = (await response.json()) as HimalayasResponse;

      if (!data.jobs || data.jobs.length === 0) {
        console.log('[Himalayas] No more jobs');
        break;
      }

      const jobs = data.jobs.map(parseHimalayasJob);
      allJobs.push(...jobs);

      console.log(`[Himalayas] Page ${page + 1}: fetched ${jobs.length} jobs (total: ${allJobs.length})`);

      offset += limit;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`[Himalayas] Error on page ${page + 1}:`, error);
      break;
    }
  }

  console.log(`[Himalayas] Fetched ${allJobs.length} total jobs`);
  return allJobs;
}
