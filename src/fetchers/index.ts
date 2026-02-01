export { fetchHNJobs } from './hn.js';
export { fetchJobicyJobs } from './jobicy.js';
export { fetchHimalayasJobs } from './himalayas.js';
export { fetchWWRJobs } from './wwr.js';
export { fetchRemoteOKJobs } from './remoteok.js';
export { fetchRemotiveJobs } from './remotive.js';
export { fetchArbeitnowJobs } from './arbeitnow.js';
export { fetchWorkingNomadsJobs } from './workingnomads.js';

import { fetchHNJobs } from './hn.js';
import { fetchJobicyJobs } from './jobicy.js';
import { fetchHimalayasJobs } from './himalayas.js';
import { fetchWWRJobs } from './wwr.js';
import { fetchRemoteOKJobs } from './remoteok.js';
import { fetchRemotiveJobs } from './remotive.js';
import { fetchArbeitnowJobs } from './arbeitnow.js';
import { fetchWorkingNomadsJobs } from './workingnomads.js';
import type { JobListing } from '../types.js';

export interface FetchResult {
  source: string;
  jobs: JobListing[];
  error?: string;
}

/**
 * Fetch jobs from all sources in parallel
 */
export async function fetchAllJobs(): Promise<FetchResult[]> {
  const results: FetchResult[] = [];

  const fetchers = [
    { name: 'hn', fn: fetchHNJobs },
    { name: 'jobicy', fn: () => fetchJobicyJobs(100) },
    { name: 'himalayas', fn: fetchHimalayasJobs },
    { name: 'wwr', fn: fetchWWRJobs },
    { name: 'remoteok', fn: fetchRemoteOKJobs },
    { name: 'remotive', fn: fetchRemotiveJobs },
    { name: 'arbeitnow', fn: fetchArbeitnowJobs },
    { name: 'workingnomads', fn: fetchWorkingNomadsJobs },
  ];

  console.log(`[Fetcher] Starting parallel fetch from ${fetchers.length} sources...`);

  const promises = fetchers.map(async ({ name, fn }) => {
    try {
      const jobs = await fn();
      return { source: name, jobs };
    } catch (error) {
      console.error(`[Fetcher] Error fetching from ${name}:`, error);
      return {
        source: name,
        jobs: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  const fetchResults = await Promise.all(promises);
  results.push(...fetchResults);

  const totalJobs = results.reduce((sum, r) => sum + r.jobs.length, 0);
  console.log(`[Fetcher] Completed. Total jobs fetched: ${totalJobs}`);

  return results;
}
