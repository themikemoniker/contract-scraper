# Project Progress Log

## Summary
Building a centralized, stateless job ingestion engine for freelance platforms (Upwork, Fiverr).
The system uses **Supabase** as the single source of truth.

## Timeline

### Phase 1: Foundation (Completed)
- **Initialized Project**: TypeScript, Node.js, Supabase SDK.
- **Database Schema**: Created `job_listings` table with:
    - UUID primary keys (gen_random_uuid).
    - Composite unique constraint `(platform, external_id)` to allow upserts.
    - `raw` JSONB column to preserve all original data.
- **Ingestion Worker**: Implemented basic worker structure in `src/ingest.ts` that handles normalization and upserts.
- **Verification**: Verified the pipeline using mock data (`npm start`).

### Phase 2: Data Access Research (Completed)
- **Objective**: Get real job data from Upwork and Fiverr.
- **Attempt 1: HTTP Scraping**:
    - Tried direct `fetch`/`axios` requests.
    - **Result**: Blocked by Cloudflare (403).
- **Attempt 2: Headless Browser (Puppeteer)**:
    - Implemented `puppeteer` script.
    - **Result**: Blocked by "Just a moment..." Cloudflare challenge.
- **Attempt 3: Stealth Scraper**:
    - Implemented `puppeteer-extra-plugin-stealth`.
    - **Result**: Still blocked by Cloudflare (Upwork) and PerimeterX (Fiverr).
- **Pivot**: Decided to switch to official **Upwork GraphQL API** for reliability.

### Phase 3: API Integration (Current Focus)
- **Upwork**: Planning to use official GraphQL API.
- **Fiverr**: TBD (API access is limited, may revisit cookies/session method later).

## Current Status
- Codebase is clean (scraping code removed).
- Ready to implement `src/upwork.ts` using `axios` and OAuth2/PAT.
- Pending User Credentials for Upwork API.
