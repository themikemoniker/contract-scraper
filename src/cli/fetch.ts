import * as fs from 'fs';
import * as path from 'path';
import { fetchAllJobs, fetchHNJobs, fetchJobicyJobs, fetchHimalayasJobs, fetchWWRJobs } from '../fetchers/index.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'sources');

const FETCHERS: Record<string, () => Promise<unknown[]>> = {
  hn: fetchHNJobs,
  jobicy: () => fetchJobicyJobs(100),
  himalayas: fetchHimalayasJobs,
  wwr: fetchWWRJobs,
  all: async () => {
    const results = await fetchAllJobs();
    return results.flatMap((r) => r.jobs);
  },
};

async function main() {
  const source = process.argv[2] ?? 'all';

  if (!FETCHERS[source]) {
    console.error(`Unknown source: ${source}`);
    console.error(`Available sources: ${Object.keys(FETCHERS).join(', ')}`);
    process.exit(1);
  }

  // Ensure directory exists
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  console.log(`Fetching jobs from: ${source}`);

  const fetcher = FETCHERS[source]!;
  const jobs = await fetcher();

  const outputPath = path.join(DATA_DIR, `${source}.json`);
  fs.writeFileSync(outputPath, JSON.stringify(jobs, null, 2));

  console.log(`Saved ${jobs.length} jobs to ${outputPath}`);
}

main().catch((error) => {
  console.error('Fetch failed:', error);
  process.exit(1);
});
