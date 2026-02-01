import * as fs from 'fs';
import * as path from 'path';
import { fetchAllJobs } from '../fetchers/index.js';
import { deduplicateJobs } from '../pipeline/dedupe.js';
import { cleanJobListings } from '../pipeline/enrich.js';
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
  console.log('[1/5] Fetching jobs from all sources...');
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

  // Step 2: Clean and enrich data
  console.log('[2/5] Cleaning and enriching job data...');
  const cleanedJobs = cleanJobListings(allJobs);
  const salaryCount = cleanedJobs.filter((j) => j.salary_min !== null).length;
  const techStackCount = cleanedJobs.filter((j) => j.tech_stack.length > 0).length;
  console.log(`     Jobs with salary: ${salaryCount}`);
  console.log(`     Jobs with tech stack: ${techStackCount}`);
  console.log();

  // Step 3: Deduplicate
  console.log('[3/5] Deduplicating jobs...');
  const dedupeResult = deduplicateJobs(cleanedJobs);
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

  // Step 4: Generate analytics
  console.log('[4/5] Generating analytics...');
  const analytics = generateAnalytics(sortedJobs);

  const statsPath = path.join(DATA_DIR, 'stats.json');
  fs.writeFileSync(statsPath, JSON.stringify(analytics, null, 2));
  console.log(`     Saved stats to ${statsPath}`);
  console.log();

  // Step 5: Generate SVG badges
  console.log('[5/5] Generating SVG badges...');
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
