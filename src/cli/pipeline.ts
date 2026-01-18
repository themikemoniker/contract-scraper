import * as fs from 'fs';
import * as path from 'path';
import { fetchAllJobs } from '../fetchers/index.js';
import { deduplicateJobs } from '../pipeline/dedupe.js';
import { generateAnalytics, generateSVGBadges } from '../analytics/generate.js';
import type { JobListing } from '../types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const SOURCES_DIR = path.join(DATA_DIR, 'sources');
const BADGES_DIR = path.join(process.cwd(), 'site', 'public', 'badges');

async function main() {
  console.log('='.repeat(60));
  console.log('Contract Scraper Pipeline');
  console.log('='.repeat(60));
  console.log();

  // Ensure directories exist
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(SOURCES_DIR)) {
    fs.mkdirSync(SOURCES_DIR, { recursive: true });
  }

  // Step 1: Fetch from all sources
  console.log('[1/4] Fetching jobs from all sources...');
  const fetchResults = await fetchAllJobs();

  // Save raw source data
  for (const result of fetchResults) {
    const sourcePath = path.join(SOURCES_DIR, `${result.source}.json`);
    fs.writeFileSync(sourcePath, JSON.stringify(result.jobs, null, 2));
    console.log(`     Saved ${result.jobs.length} jobs to ${result.source}.json`);
  }

  // Combine all jobs
  const allJobs: JobListing[] = fetchResults.flatMap((r) => r.jobs);
  console.log(`     Total fetched: ${allJobs.length} jobs`);
  console.log();

  // Step 2: Deduplicate
  console.log('[2/4] Deduplicating jobs...');
  const dedupeResult = deduplicateJobs(allJobs);
  console.log(`     Unique jobs: ${dedupeResult.stats.totalUnique}`);
  console.log(`     Duplicates removed: ${dedupeResult.stats.totalDuplicates}`);
  console.log();

  // Sort by posted date (most recent first)
  const sortedJobs = dedupeResult.unique.sort((a, b) => {
    const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return dateB - dateA;
  });

  // Save deduplicated jobs
  const jobsPath = path.join(DATA_DIR, 'jobs.json');
  fs.writeFileSync(jobsPath, JSON.stringify(sortedJobs, null, 2));
  console.log(`     Saved to ${jobsPath}`);
  console.log();

  // Step 3: Generate analytics
  console.log('[3/4] Generating analytics...');
  const analytics = generateAnalytics(sortedJobs);

  const statsPath = path.join(DATA_DIR, 'stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(analytics, null, 2));
  console.log(`     Saved stats to ${statsPath}`);
  console.log();

  // Step 4: Generate SVG badges
  console.log('[4/4] Generating SVG badges...');
  generateSVGBadges(analytics, BADGES_DIR);
  console.log();

  // Summary
  console.log('='.repeat(60));
  console.log('Pipeline Complete!');
  console.log('='.repeat(60));
  console.log();
  console.log('Summary:');
  console.log(`  - Total jobs: ${analytics.totalJobs}`);
  console.log(`  - Sources: ${Object.keys(analytics.bySource).join(', ')}`);
  console.log(`  - Top tech: ${Object.entries(analytics.byTechStack)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([t, c]) => `${t}(${c})`)
    .join(', ')}`);
  console.log();
}

main().catch((error) => {
  console.error('Pipeline failed:', error);
  process.exit(1);
});
