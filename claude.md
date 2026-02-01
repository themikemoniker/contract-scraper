# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SWE contractor job aggregator that fetches from multiple sources (Hacker News, Jobicy, Himalayas, We Work Remotely), deduplicates using fuzzy matching, enriches with tech stack detection, and publishes to a static Astro site on GitHub Pages.

**Auto-deployment**: GitHub Actions runs the pipeline every 6 hours, commits updated data, and deploys to Pages.

## Essential Commands

### Pipeline Operations
```bash
# Full pipeline: fetch → dedupe → analytics → badges
npm run pipeline

# Individual steps
npm run fetch              # Fetch from all sources
npm run fetch hn           # Fetch only Hacker News
npm run fetch jobicy       # Fetch only Jobicy
npm run dedupe             # Run deduplication only
npm run analytics          # Generate analytics/badges only
```

### Site Development
```bash
# First-time setup
npm install
cd site && npm install && cd ..

# Development
npm run dev                # Start Astro dev server (localhost:4321)
npm run build              # Build static site for production

# From within site/ directory
cd site
npm run dev
npm run build
npm run preview            # Preview production build
```

### Manual Deployment
```bash
gh workflow run update-jobs.yml    # Trigger GitHub Actions workflow
```

## Architecture

### Pipeline Flow (src/cli/pipeline.ts)

1. **Fetch** ([src/fetchers/](src/fetchers/)) - Parallel fetch from 4 sources
   - Each fetcher exports a `fetchXXXJobs()` function returning `JobListing[]`
   - Raw data saved to `data/sources/{source}.json`
   - All fetchers registered in [src/fetchers/index.ts](src/fetchers/index.ts)

2. **Deduplicate** ([src/pipeline/dedupe.ts](src/pipeline/dedupe.ts))
   - Fuzzy string matching on normalized company + title
   - Uses Levenshtein distance with 85% similarity threshold
   - Priority: HN > WWR > Jobicy > Himalayas (+ bonus for salary/description/tech stack)
   - Keeps best job per cluster based on priority + data completeness

3. **Enrich** ([src/pipeline/enrich.ts](src/pipeline/enrich.ts))
   - Tech stack detection from description/title (regex patterns)
   - Company name normalization (lowercasing, punctuation removal)
   - Title normalization for deduplication

4. **Analytics** ([src/analytics/generate.ts](src/analytics/generate.ts))
   - Generates stats by source, tech stack, contract type, remote type, salary ranges
   - Creates SVG badges for README (total jobs, sources, updated timestamp)
   - Outputs to `data/stats.json` and `site/public/badges/*.svg`

### Data Flow

```
External APIs/RSS
    ↓
data/sources/{hn,jobicy,himalayas,wwr}.json  (raw per-source)
    ↓
data/jobs.json  (deduplicated, enriched, sorted by posted_at)
    ↓
data/stats.json  (analytics)
    ↓
site/public/badges/*.svg  (generated badges)
    ↓
site/dist/  (built Astro site)
```

### Data Model

All jobs conform to `JobListing` interface ([src/types.ts](src/types.ts)):
- `id`: Generated as `platform:external_id`
- Normalized salary fields (`salary_min/max`, `salary_currency`, `salary_type`)
- Enriched fields: `tech_stack[]`, `tags[]`
- Raw source payload preserved in `raw` field

### TypeScript Configuration

- Uses `"module": "nodenext"` with ES modules (`.js` imports in TS files)
- Strict mode enabled with extra checks (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- Run with `tsx` (no build step needed for CLI scripts)

## Adding New Job Sources

1. Create `src/fetchers/{source}.ts` with `export async function fetchXXXJobs(): Promise<JobListing[]>`
2. Map source-specific fields to `JobListing` schema
3. Add to `src/fetchers/index.ts` exports and `fetchAllJobs()` function
4. Tech stack detection happens automatically in pipeline

## CI/CD Details

**Workflow**: [.github/workflows/update-jobs.yml](.github/workflows/update-jobs.yml)
- Runs on schedule (`0 */6 * * *`), push to main, or manual trigger
- Steps: checkout → install → `npm run pipeline` → commit data → install site deps → build → deploy to Pages
- Commits have `[skip ci]` to prevent infinite loops

## Key Files

- [src/types.ts](src/types.ts) - Shared TypeScript types
- [src/cli/pipeline.ts](src/cli/pipeline.ts) - Main orchestration script
- [src/pipeline/dedupe.ts](src/pipeline/dedupe.ts) - Deduplication logic (similarity threshold, priority scoring)
- [src/pipeline/enrich.ts](src/pipeline/enrich.ts) - Text normalization and tech stack detection
- [data/jobs.json](data/jobs.json) - Single source of truth for deduplicated jobs (consumed by Astro)
