# Contract Scraper

A distributed, stateless ingestion machine for freelance job listings (Upwork, Fiverr).
**System of Record**: Supabase (Postgres).

## Vision
To build a durable, queryable database of freelance opportunities that survives local machine destruction.
- **Stateless Workers**: Ingestion scripts can run anywhere (Docker, local, serverless).
- **Canonical Data**: All jobs are normalized to a common schema but preserve their `raw` source data.
- **Idempotent**: Runs safely multiple times without creating duplicates.

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2.  **Environment Variables**
    Create `.env`:
    ```env
    SUPABASE_URL=...
    SUPABASE_KEY=...
    # Upwork Credentials (TBD)
    UPWORK_ACCESS_TOKEN=...
    ```

3.  **Run Ingestion**
    ```bash
    npm start
    ```

## Roadmap

### Stage 1: Foundation (✅ Done)
- [x] TypeScript project setup
- [x] internal `job_listings` schema (Supabase)
- [x] Basic ingestion/normalization logic
- [x] Upsert pipeline verification with mock data

### Stage 2: Upwork Integration (🚧 In Progress)
- [ ] Implement Upwork GraphQL Client (`src/upwork.ts`)
- [ ] Authenticate via OAuth2 or PAT
- [ ] Fetch real job listings
- [ ] Map GraphQL response to `JobListing` schema

### Stage 3: Fiverr Integration (⏳ Pending)
- [ ] Research Fiverr API or Session-based access
- [ ] Implement Fiverr fetcher
- [ ] Normalize Fiverr unique fields (fixed price focus)

### Stage 4: Advanced Features (🔮 Future)
- [ ] Deduplication logic (if needed beyond DB constraints)
- [ ] Keyword matching / Scoring system
- [ ] Periodic cron jobs / Dockerization
- [ ] AI-based job analysis (LLM integration)
