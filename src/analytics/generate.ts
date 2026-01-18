import type { JobListing, AnalyticsData } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Generate analytics data from job listings
 */
export function generateAnalytics(jobs: JobListing[]): AnalyticsData {
  const bySource: Record<string, number> = {};
  const byTechStack: Record<string, number> = {};
  const byContractType: Record<string, number> = {};
  const byRemoteType: Record<string, number> = {};
  const bySalaryRange = {
    under50k: 0,
    '50k-100k': 0,
    '100k-150k': 0,
    '150k-200k': 0,
    over200k: 0,
    unknown: 0,
  };

  for (const job of jobs) {
    // By source
    bySource[job.platform] = (bySource[job.platform] ?? 0) + 1;

    // By tech stack
    for (const tech of job.tech_stack) {
      byTechStack[tech] = (byTechStack[tech] ?? 0) + 1;
    }

    // By contract type
    if (job.contract_type) {
      byContractType[job.contract_type] = (byContractType[job.contract_type] ?? 0) + 1;
    }

    // By remote type
    if (job.remote_type) {
      byRemoteType[job.remote_type] = (byRemoteType[job.remote_type] ?? 0) + 1;
    }

    // By salary range (normalize to yearly)
    let yearlySalary = job.salary_min;
    if (job.salary_type === 'hourly' && yearlySalary) {
      yearlySalary = yearlySalary * 2080; // 40 hours * 52 weeks
    }

    if (yearlySalary === null) {
      bySalaryRange.unknown++;
    } else if (yearlySalary < 50000) {
      bySalaryRange.under50k++;
    } else if (yearlySalary < 100000) {
      bySalaryRange['50k-100k']++;
    } else if (yearlySalary < 150000) {
      bySalaryRange['100k-150k']++;
    } else if (yearlySalary < 200000) {
      bySalaryRange['150k-200k']++;
    } else {
      bySalaryRange.over200k++;
    }
  }

  // Calculate jobs posted in last 7 days
  const now = new Date();
  const jobsLast7Days: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    const count = jobs.filter((job) => {
      if (!job.posted_at) return false;
      const postedDate = new Date(job.posted_at);
      return postedDate >= dayStart && postedDate <= dayEnd;
    }).length;

    jobsLast7Days.push(count);
  }

  return {
    totalJobs: jobs.length,
    bySource,
    byTechStack,
    byContractType,
    byRemoteType,
    bySalaryRange,
    lastUpdated: new Date().toISOString(),
    jobsLast7Days,
  };
}

/**
 * Generate SVG badge
 */
function generateBadge(label: string, value: string, color: string): string {
  const labelWidth = label.length * 7 + 10;
  const valueWidth = value.length * 7 + 10;
  const totalWidth = labelWidth + valueWidth;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="a">
    <rect width="${totalWidth}" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#a)">
    <path fill="#555" d="M0 0h${labelWidth}v20H0z"/>
    <path fill="${color}" d="M${labelWidth} 0h${valueWidth}v20H${labelWidth}z"/>
    <path fill="url(#b)" d="M0 0h${totalWidth}v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="14">${label}</text>
    <text x="${labelWidth + valueWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${labelWidth + valueWidth / 2}" y="14">${value}</text>
  </g>
</svg>`;
}

/**
 * Generate sparkline SVG for 7-day trend
 */
function generateSparkline(data: number[], color: string = '#2563eb'): string {
  const width = 100;
  const height = 30;
  const padding = 2;

  const max = Math.max(...data, 1);
  const min = 0;

  const points = data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / (max - min)) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <path d="${pathData}" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  ${data.map((value, index) => {
    const x = padding + (index / (data.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / (max - min)) * (height - padding * 2);
    return `<circle cx="${x}" cy="${y}" r="2" fill="${color}"/>`;
  }).join('\n  ')}
</svg>`;
}

/**
 * Generate bar chart SVG for tech stack
 */
function generateBarChart(
  data: Record<string, number>,
  maxItems: number = 10
): string {
  const sortedItems = Object.entries(data)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxItems);

  const maxValue = Math.max(...sortedItems.map(([, v]) => v), 1);
  const barHeight = 20;
  const labelWidth = 100;
  const chartWidth = 200;
  const padding = 5;
  const height = sortedItems.length * (barHeight + padding) + padding;
  const width = labelWidth + chartWidth + 50;

  const bars = sortedItems.map(([label, value], index) => {
    const y = padding + index * (barHeight + padding);
    const barWidth = (value / maxValue) * chartWidth;

    return `
    <text x="${labelWidth - 5}" y="${y + barHeight / 2 + 4}" text-anchor="end" font-size="11" fill="#374151">${label}</text>
    <rect x="${labelWidth}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#3b82f6" rx="2"/>
    <text x="${labelWidth + barWidth + 5}" y="${y + barHeight / 2 + 4}" font-size="11" fill="#6b7280">${value}</text>`;
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <style>
    text { font-family: system-ui, -apple-system, sans-serif; }
  </style>
  ${bars.join('')}
</svg>`;
}

/**
 * Generate all SVG badges and save to disk
 */
export function generateSVGBadges(analytics: AnalyticsData, outputDir: string): void {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Total jobs badge
  fs.writeFileSync(
    path.join(outputDir, 'total-jobs.svg'),
    generateBadge('jobs', String(analytics.totalJobs), '#2563eb')
  );

  // Sources badge
  const sourceCount = Object.keys(analytics.bySource).length;
  fs.writeFileSync(
    path.join(outputDir, 'sources.svg'),
    generateBadge('sources', String(sourceCount), '#16a34a')
  );

  // Last updated badge
  const lastUpdated = new Date(analytics.lastUpdated);
  const hoursAgo = Math.round((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60));
  const updatedText = hoursAgo < 1 ? 'just now' : `${hoursAgo}h ago`;
  fs.writeFileSync(
    path.join(outputDir, 'updated.svg'),
    generateBadge('updated', updatedText, '#ca8a04')
  );

  // 7-day trend sparkline
  fs.writeFileSync(
    path.join(outputDir, 'trend.svg'),
    generateSparkline(analytics.jobsLast7Days)
  );

  // Tech stack chart
  fs.writeFileSync(
    path.join(outputDir, 'tech-stack.svg'),
    generateBarChart(analytics.byTechStack, 10)
  );

  // Source breakdown chart
  fs.writeFileSync(
    path.join(outputDir, 'sources-chart.svg'),
    generateBarChart(analytics.bySource, 5)
  );

  console.log(`[Analytics] Generated SVG badges in ${outputDir}`);
}

/**
 * Generate markdown table for README
 */
export function generateMarkdownStats(analytics: AnalyticsData): string {
  const topTech = Object.entries(analytics.byTechStack)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([tech, count]) => `${tech} (${count})`)
    .join(', ');

  const sourcesList = Object.entries(analytics.bySource)
    .map(([source, count]) => `- **${source}**: ${count} jobs`)
    .join('\n');

  return `## Current Stats

| Metric | Value |
|--------|-------|
| Total Jobs | ${analytics.totalJobs} |
| Sources | ${Object.keys(analytics.bySource).length} |
| Last Updated | ${new Date(analytics.lastUpdated).toLocaleString()} |

### Jobs by Source
${sourcesList}

### Top Technologies
${topTech}
`;
}
