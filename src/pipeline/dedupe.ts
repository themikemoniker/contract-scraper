import type { JobListing, DedupeResult } from '../types.js';
import { normalizeCompanyName, normalizeTitle, similarityScore } from './enrich.js';

const SIMILARITY_THRESHOLD = 0.85;

interface DedupeKey {
  normalizedCompany: string;
  normalizedTitle: string;
}

function getDedupeKey(job: JobListing): DedupeKey {
  return {
    normalizedCompany: normalizeCompanyName(job.company),
    normalizedTitle: normalizeTitle(job.title),
  };
}

function areSimilar(a: DedupeKey, b: DedupeKey): boolean {
  // Company must match closely
  const companySimilarity = similarityScore(a.normalizedCompany, b.normalizedCompany);
  if (companySimilarity < SIMILARITY_THRESHOLD) {
    return false;
  }

  // Title must match closely
  const titleSimilarity = similarityScore(a.normalizedTitle, b.normalizedTitle);
  if (titleSimilarity < SIMILARITY_THRESHOLD) {
    return false;
  }

  return true;
}

// Priority order for sources (higher = preferred when deduping)
const SOURCE_PRIORITY: Record<string, number> = {
  hn: 4, // HN has direct company contact
  wwr: 3, // WWR has good descriptions
  jobicy: 2, // Jobicy has salary data
  himalayas: 1, // Himalayas as fallback
};

function getPriority(job: JobListing): number {
  const basePriority = SOURCE_PRIORITY[job.platform] ?? 0;

  // Boost score for jobs with more data
  let bonus = 0;
  if (job.salary_min !== null) bonus += 2;
  if (job.description && job.description.length > 200) bonus += 1;
  if (job.tech_stack.length > 2) bonus += 1;

  return basePriority + bonus;
}

function selectBestJob(jobs: JobListing[]): JobListing {
  // Sort by priority (descending), then by posted_at (most recent first)
  return jobs.sort((a, b) => {
    const priorityDiff = getPriority(b) - getPriority(a);
    if (priorityDiff !== 0) return priorityDiff;

    // If same priority, prefer more recent
    const dateA = a.posted_at ? new Date(a.posted_at).getTime() : 0;
    const dateB = b.posted_at ? new Date(b.posted_at).getTime() : 0;
    return dateB - dateA;
  })[0]!;
}

/**
 * Deduplicate jobs using fuzzy matching on company + title
 */
export function deduplicateJobs(jobs: JobListing[]): DedupeResult {
  console.log(`[Dedupe] Starting deduplication of ${jobs.length} jobs...`);

  const clusters: JobListing[][] = [];
  const processed = new Set<string>();

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i]!;

    if (processed.has(job.id)) {
      continue;
    }

    const jobKey = getDedupeKey(job);
    const cluster: JobListing[] = [job];
    processed.add(job.id);

    // Find all similar jobs
    for (let j = i + 1; j < jobs.length; j++) {
      const otherJob = jobs[j]!;

      if (processed.has(otherJob.id)) {
        continue;
      }

      const otherKey = getDedupeKey(otherJob);

      if (areSimilar(jobKey, otherKey)) {
        cluster.push(otherJob);
        processed.add(otherJob.id);
      }
    }

    clusters.push(cluster);
  }

  // Build result
  const unique: JobListing[] = [];
  const duplicates: Array<{ kept: JobListing; removed: JobListing[] }> = [];

  for (const cluster of clusters) {
    if (cluster.length === 1) {
      unique.push(cluster[0]!);
    } else {
      const best = selectBestJob(cluster);
      unique.push(best);

      duplicates.push({
        kept: best,
        removed: cluster.filter((j) => j.id !== best.id),
      });
    }
  }

  const stats = {
    totalInput: jobs.length,
    totalUnique: unique.length,
    totalDuplicates: jobs.length - unique.length,
  };

  console.log(`[Dedupe] Results: ${stats.totalUnique} unique, ${stats.totalDuplicates} duplicates removed`);

  return { unique, duplicates, stats };
}

/**
 * Merge job data from multiple sources (if same job appears in multiple places)
 */
export function mergeJobData(primary: JobListing, secondary: JobListing): JobListing {
  return {
    ...primary,
    // Take salary if primary doesn't have it
    salary_min: primary.salary_min ?? secondary.salary_min,
    salary_max: primary.salary_max ?? secondary.salary_max,
    salary_currency: primary.salary_currency ?? secondary.salary_currency,
    salary_type: primary.salary_type ?? secondary.salary_type,

    // Merge tech stacks
    tech_stack: [...new Set([...primary.tech_stack, ...secondary.tech_stack])],

    // Merge tags
    tags: [...new Set([...primary.tags, ...secondary.tags])],

    // Take longer description
    description:
      (primary.description?.length ?? 0) >= (secondary.description?.length ?? 0)
        ? primary.description
        : secondary.description,

    // Take experience level if primary doesn't have it
    experience_level: primary.experience_level ?? secondary.experience_level,

    // Take contract type if primary doesn't have it
    contract_type: primary.contract_type ?? secondary.contract_type,
  };
}
