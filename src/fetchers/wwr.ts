import { XMLParser } from 'fast-xml-parser';
import type { JobListing } from '../types.js';
import { extractTechStack, detectExperienceLevel, detectContractType } from '../pipeline/enrich.js';

const WWR_RSS_FEEDS = [
  {
    url: 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    category: 'programming',
  },
  {
    url: 'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
    category: 'devops',
  },
];

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  'dc:creator'?: string;
  category?: string | string[];
  guid: string;
}

interface RSSChannel {
  title: string;
  item: RSSItem | RSSItem[];
}

interface RSSFeed {
  rss: {
    channel: RSSChannel;
  };
}

function parseWWRJob(item: RSSItem, feedCategory: string): JobListing {
  // WWR title format: "Company: Job Title"
  const titleParts = item.title.split(':');
  const company = titleParts[0]?.trim() ?? null;
  const title = titleParts.slice(1).join(':').trim() || item.title;

  // Clean HTML from description
  const description = item.description
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const techStack = extractTechStack(description + ' ' + title);
  const experienceLevel = detectExperienceLevel(description);

  // Extract job ID from link
  const linkParts = item.link.split('/');
  const externalId = linkParts[linkParts.length - 1] ?? item.guid;

  // Get categories/tags
  const tags: string[] = [feedCategory];
  if (item.category) {
    if (Array.isArray(item.category)) {
      tags.push(...item.category);
    } else {
      tags.push(item.category);
    }
  }

  return {
    id: `wwr:${externalId}`,
    platform: 'wwr',
    external_id: externalId ?? item.guid,
    title,
    company,
    description,
    url: item.link,

    salary_min: null,
    salary_max: null,
    salary_currency: null,
    salary_type: null,

    contract_type: 'full-time',
    experience_level: experienceLevel,

    location: 'Remote',
    remote_type: 'remote',
    timezone: null,

    tech_stack: techStack,
    tags,

    posted_at: new Date(item.pubDate).toISOString(),
    fetched_at: new Date().toISOString(),

    raw: item as unknown as Record<string, unknown>,
  };
}

async function fetchRSSFeed(url: string, category: string): Promise<JobListing[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WWR RSS failed: ${response.status}`);
  }

  const xml = await response.text();

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  });

  const feed = parser.parse(xml) as RSSFeed;

  if (!feed.rss?.channel?.item) {
    return [];
  }

  const items = Array.isArray(feed.rss.channel.item)
    ? feed.rss.channel.item
    : [feed.rss.channel.item];

  return items.map((item) => parseWWRJob(item, category));
}

export async function fetchWWRJobs(): Promise<JobListing[]> {
  console.log('[WWR] Fetching RSS feeds...');

  const allJobs: JobListing[] = [];

  for (const feed of WWR_RSS_FEEDS) {
    try {
      console.log(`[WWR] Fetching ${feed.category} jobs...`);
      const jobs = await fetchRSSFeed(feed.url, feed.category);
      allJobs.push(...jobs);
      console.log(`[WWR] Fetched ${jobs.length} ${feed.category} jobs`);
    } catch (error) {
      console.error(`[WWR] Error fetching ${feed.category}:`, error);
    }
  }

  console.log(`[WWR] Fetched ${allJobs.length} total jobs`);
  return allJobs;
}
