import type { JobListing, HNItem } from '../types.js';
import { extractTechStack, detectExperienceLevel } from '../pipeline/enrich.js';

const HN_ALGOLIA_API = 'https://hn.algolia.com/api/v1';

interface AlgoliaSearchResult {
  hits: Array<{
    objectID: string;
    title: string;
    created_at: string;
  }>;
}

interface AlgoliaItem {
  id: number;
  created_at: string;
  author: string;
  text: string;
  children: AlgoliaItem[];
}

// Find the most recent "Who is hiring?" thread
async function findWhoIsHiringThread(): Promise<string | null> {
  const query = encodeURIComponent('Ask HN: Who is hiring?');
  const url = `${HN_ALGOLIA_API}/search?query=${query}&tags=story&hitsPerPage=5`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HN search failed: ${response.status}`);
  }

  const data = (await response.json()) as AlgoliaSearchResult;

  // Find the most recent "Who is hiring?" thread (monthly)
  const hiringThread = data.hits.find(
    (hit) =>
      hit.title.toLowerCase().includes('who is hiring') &&
      hit.title.toLowerCase().includes('ask hn')
  );

  return hiringThread?.objectID ?? null;
}

// Fetch all comments (job posts) from a thread
async function fetchThreadComments(threadId: string): Promise<AlgoliaItem[]> {
  const url = `${HN_ALGOLIA_API}/items/${threadId}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HN item fetch failed: ${response.status}`);
  }

  const data = (await response.json()) as AlgoliaItem;

  // Return top-level comments only (these are the job posts)
  return data.children ?? [];
}

// Parse a HN job post comment into a JobListing
function parseHNJobPost(comment: AlgoliaItem): JobListing | null {
  if (!comment.text || comment.text.length < 50) {
    return null; // Skip very short comments
  }

  const text = comment.text;

  // Try to extract company name from the first line
  // Common format: "Company Name | Location | Role | ..."
  const firstLine = text.split(/<p>|<br>/i)[0] ?? '';
  const parts = firstLine.split('|').map((p) => p.replace(/<[^>]*>/g, '').trim());

  const company = parts[0] ?? null;
  const title = parts.length > 2 ? parts.slice(1).join(' - ') : 'Software Engineer';

  // Extract location
  const locationMatch = text.match(/\b(remote|onsite|hybrid|on-site)\b/i);
  const remoteType = locationMatch
    ? (locationMatch[1]?.toLowerCase().replace('-', '') as 'remote' | 'hybrid' | 'onsite')
    : null;

  // Clean HTML from description
  const description = text
    .replace(/<p>/gi, '\n\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .trim();

  const techStack = extractTechStack(description);
  const experienceLevel = detectExperienceLevel(description);

  return {
    id: `hn:${comment.id}`,
    platform: 'hn',
    external_id: String(comment.id),
    title: title || 'Software Engineer',
    company,
    description,
    url: `https://news.ycombinator.com/item?id=${comment.id}`,

    salary_min: null,
    salary_max: null,
    salary_currency: null,
    salary_type: null,

    contract_type: 'full-time',
    experience_level: experienceLevel,

    location: parts[1]?.trim() ?? null,
    remote_type: remoteType,
    timezone: null,

    tech_stack: techStack,
    tags: ['hn', 'who-is-hiring'],

    posted_at: comment.created_at,
    fetched_at: new Date().toISOString(),

    raw: comment as unknown as Record<string, unknown>,
  };
}

export async function fetchHNJobs(): Promise<JobListing[]> {
  console.log('[HN] Finding latest "Who is hiring?" thread...');

  const threadId = await findWhoIsHiringThread();
  if (!threadId) {
    console.log('[HN] No hiring thread found');
    return [];
  }

  console.log(`[HN] Found thread: ${threadId}`);
  console.log('[HN] Fetching job posts...');

  const comments = await fetchThreadComments(threadId);
  console.log(`[HN] Found ${comments.length} comments`);

  const jobs: JobListing[] = [];
  for (const comment of comments) {
    const job = parseHNJobPost(comment);
    if (job) {
      jobs.push(job);
    }
  }

  console.log(`[HN] Parsed ${jobs.length} valid job posts`);
  return jobs;
}
