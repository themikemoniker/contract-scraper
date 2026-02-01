# Job Sources Research - SWE Contractor/Freelance Opportunities

**Research Date:** January 31, 2026
**Purpose:** Identify programmatically accessible job sources for software engineering contractor/freelance positions

---

## Summary Table

| Source | Access Method | Contractor % | Volume | Auth | Why Recommended |
|--------|--------------|--------------|--------|------|-----------------|
| **Remotive** | JSON API | ~20% contract/freelance | 25+ SWE jobs | None | Excellent docs, job_type filter, salary data |
| **Remote OK** | JSON API | ~15% contract | 20+ per fetch | None | Open salaries, tech-focused, good tags |
| **Himalayas** | JSON API | ~10% contract | 113K+ total jobs | None | Massive volume, timezone filters, salary data |
| **We Work Remotely** | RSS Feed | ~10% contract | 8+ per feed | None | Already in use, reliable, category feeds |
| **Working Nomads** | JSON API | ~15% freelance | 25+ per fetch | None | Simple API, good categories |
| **Arbeitnow** | JSON API | ~10% contract | 25+ per fetch | None | Europe focus, visa sponsorship filter |

### Already Implemented (Current Sources)
- Hacker News "Who is Hiring?" (Algolia API)
- Jobicy (Public API)
- Himalayas (Public API)
- We Work Remotely (RSS)

---

## Detailed Source Analysis

### 1. Remotive API ⭐ Highly Recommended

**URL:** https://remotive.com
**API Endpoint:** `https://remotive.com/api/remote-jobs`
**Documentation:** https://github.com/remotive-com/remote-jobs-api

#### Data Fields Available
- `id`, `url`, `title`, `company_name`, `company_logo`
- `category` (software-dev, marketing, design, etc.)
- `tags` (technology keywords)
- `job_type` (full_time, contract, freelance)
- `publication_date`
- `candidate_required_location`
- `salary` (when provided)
- `description` (HTML formatted)

#### Query Parameters
```
?category=software-dev    # Filter by category
?company_name=acme        # Filter by company
?search=react             # Search title/description
?limit=50                 # Limit results
```

#### Rate Limits
- Max 4 requests/day recommended
- >2 requests/minute will be blocked
- Jobs delayed 24 hours from posting

#### Contractor Focus
Supports `job_type` filter for contract/freelance positions. Approximately 20% of listings are non-full-time.

#### Code Example
```typescript
const response = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=50');
const data = await response.json();
// data.jobs contains array of job objects
// data['job-count'] shows total matches
```

#### Pros
- No authentication required
- Excellent documentation
- Job type filtering (contract, freelance, full_time)
- Salary information when available
- Category-based filtering

#### Cons
- 24-hour delay on job listings
- Rate limited (max 4x/day recommended)
- Attribution required (must link back to Remotive)

---

### 2. Remote OK API ⭐ Highly Recommended

**URL:** https://remoteok.com
**API Endpoint:** `https://remoteok.com/api`

#### Data Fields Available
- `slug`, `id`, `epoch`, `date`
- `company`, `company_logo`
- `position` (job title)
- `tags` (array of keywords)
- `description` (HTML)
- `location`
- `apply_url`
- `salary_min`, `salary_max`
- `url`

#### Rate Limits
Not explicitly documented, but reasonable use expected.

#### Contractor Focus
Approximately 15% contract positions. No explicit job type filter, but tags often indicate contract work.

#### Code Example
```typescript
const response = await fetch('https://remoteok.com/api');
const data = await response.json();
// First element is metadata, rest are jobs
const jobs = data.slice(1);
```

#### Pros
- No authentication required
- Open salary data (#OpenSalaries initiative)
- Tech-focused job board
- Good tag-based categorization
- Returns ~20 jobs per request

#### Cons
- No job type filter in API
- First array element is metadata (not a job)
- No pagination documented

---

### 3. Himalayas API ⭐ Highly Recommended

**URL:** https://himalayas.app
**API Endpoint:** `https://himalayas.app/jobs/api`
**RSS Feed:** `https://himalayas.app/jobs/rss`

#### Data Fields Available
- `title`, `excerpt`, `companyName`, `companyLogo`
- `employmentType`
- `minSalary`, `maxSalary`, `currency`
- `seniority` (array)
- `locationRestrictions` (array)
- `timezoneRestrictions` (array)
- `categories`, `parentCategories`
- `description` (HTML)
- `pubDate`, `expiryDate`
- `applicationLink`, `guid`

#### Query Parameters
```
?offset=0      # Pagination offset
?limit=50      # Results per page (max appears to be 50)
```

#### Volume
**113,149+ total jobs** in database - largest volume of any source tested.

#### Contractor Focus
Approximately 10% contract positions. The `employmentType` field indicates job type.

#### Code Example
```typescript
const response = await fetch('https://himalayas.app/jobs/api?limit=50&offset=0');
const data = await response.json();
// data.jobs contains array
// data.totalCount shows total available
// data.offset/limit for pagination
```

#### Pros
- Massive job volume (100K+)
- Excellent timezone/location filtering
- Salary data included
- Pagination support
- Also offers MCP integration for AI assistants

#### Cons
- API returns many non-tech jobs
- Need to filter for SWE roles client-side

---

### 4. Working Nomads API ⭐ Recommended

**URL:** https://www.workingnomads.com
**API Endpoint:** `https://www.workingnomads.com/api/exposed_jobs/`

#### Data Fields Available
- `url`, `title`
- `description` (HTML)
- `company_name`
- `category_name` (Development, Design, etc.)
- `tags` (comma-separated skills)
- `location`
- `pub_date`

#### Volume
~25 jobs per request, focused on remote/nomad-friendly positions.

#### Contractor Focus
Good mix of contract and full-time positions (~15% freelance).

#### Code Example
```typescript
const response = await fetch('https://www.workingnomads.com/api/exposed_jobs/');
const jobs = await response.json();
// Returns array of job objects directly
```

#### Pros
- No authentication
- Simple, clean API
- Nomad/remote-first focus
- Good category filtering

#### Cons
- Smaller volume than other sources
- No explicit job type field
- Limited filtering options

---

### 5. Arbeitnow API (Europe Focus)

**URL:** https://www.arbeitnow.com
**API Endpoint:** `https://www.arbeitnow.com/api/job-board-api`

#### Data Fields Available
- `slug`, `company_name`, `title`
- `description` (HTML)
- `remote` (boolean)
- `url`
- `tags` (array)
- `job_types` (array)
- `location`
- `created_at` (Unix timestamp)

#### Query Parameters
```
?remote=true              # Remote jobs only
?visa_sponsorship=true    # Jobs with visa sponsorship
```

#### Contractor Focus
Approximately 10% contract positions in Europe.

#### Code Example
```typescript
const response = await fetch('https://www.arbeitnow.com/api/job-board-api?remote=true');
const data = await response.json();
// data.data contains array of jobs
```

#### Pros
- No authentication
- Remote filter
- Visa sponsorship filter (useful for international hires)
- Clean JSON structure

#### Cons
- Europe-focused (may have limited US/global jobs)
- Smaller tech job volume
- German-language job board origin

---

### 6. We Work Remotely RSS (Already Implemented)

**URL:** https://weworkremotely.com
**RSS Feed:** `https://weworkremotely.com/remote-jobs.rss`

#### Category-Specific Feeds
```
/categories/remote-programming-jobs.rss
/categories/remote-devops-sysadmin-jobs.rss
/categories/remote-design-jobs.rss
```

#### Data Fields (RSS)
- `<title>` - Position title
- `<region>`, `<country>`, `<state>`
- `<skills>` - Required skills
- `<category>` - Job classification
- `<type>` - Employment type
- `<description>` - Full HTML description
- `<pubDate>` - Publication date
- `<expires_at>` - Expiration date
- `<link>` - Application URL

#### Pros
- Simple RSS parsing
- Category-specific feeds
- Reliable and stable
- No authentication

#### Cons
- Smaller volume (~8 jobs in feed)
- RSS format less structured than JSON
- No search/filter capabilities

---

## Sources NOT Recommended

### Wellfound (formerly AngelList)
- **Status:** No public API
- **Alternative:** Third-party scrapers (Apify, Bright Data) available but may violate ToS

### Gun.io
- **Status:** No public API or feed
- **Access:** Account-based matching system only

### Authentic Jobs
- **Status:** API appears defunct (404 errors)
- **Previously:** Required API key, had good designer/developer focus

### Flexiple
- **Status:** No public API
- **Access:** Application-based matching only

### Turing.com
- **Status:** No public API
- **Access:** Developer signup required

### Arc.dev
- **Status:** No public job feed API found
- **Access:** Account-based job matching

### Reddit /r/forhire
- **Status:** API requires OAuth + commercial approval
- **Limitation:** Commercial use requires explicit Reddit permission
- **Rate Limits:** Significant restrictions post-2023 API changes

### Freelancer.com
- **Status:** API requires OAuth 2.0 authentication
- **Complexity:** Full OAuth flow needed, not suitable for simple automated fetching

### Dribbble Jobs
- **Status:** Jobs API requires partnership
- **Access:** Contact Dribbble for API access

---

## Implementation Priority

### Tier 1 - Implement First (Best Value)
1. **Remotive** - Best documentation, job type filtering, salary data
2. **Remote OK** - Open salaries, tech-focused, simple API

### Tier 2 - Add for Volume
3. **Working Nomads** - Simple API, nomad-focused community

### Tier 3 - Consider for Specific Needs
4. **Arbeitnow** - If European jobs needed, visa sponsorship filtering

### Already Implemented
- Hacker News (Algolia API)
- Jobicy (API)
- Himalayas (API)
- We Work Remotely (RSS)

---

## Sample Integration Code

### Remotive Fetcher
```typescript
interface RemotiveJob {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

async function fetchRemotiveJobs(): Promise<RemotiveJob[]> {
  const response = await fetch(
    'https://remotive.com/api/remote-jobs?category=software-dev'
  );
  const data = await response.json();

  // Filter for contract/freelance if needed
  return data.jobs.filter((job: RemotiveJob) =>
    ['contract', 'freelance'].includes(job.job_type.toLowerCase())
  );
}
```

### Remote OK Fetcher
```typescript
interface RemoteOKJob {
  slug: string;
  id: string;
  company: string;
  position: string;
  tags: string[];
  description: string;
  location: string;
  salary_min: number;
  salary_max: number;
  apply_url: string;
  date: string;
}

async function fetchRemoteOKJobs(): Promise<RemoteOKJob[]> {
  const response = await fetch('https://remoteok.com/api');
  const data = await response.json();

  // First element is metadata, skip it
  return data.slice(1);
}
```

### Working Nomads Fetcher
```typescript
interface WorkingNomadsJob {
  url: string;
  title: string;
  description: string;
  company_name: string;
  category_name: string;
  tags: string;
  location: string;
  pub_date: string;
}

async function fetchWorkingNomadsJobs(): Promise<WorkingNomadsJob[]> {
  const response = await fetch(
    'https://www.workingnomads.com/api/exposed_jobs/'
  );
  return response.json();
}
```

---

## Rate Limiting Strategy

For a 6-hour automated fetch cycle:
- **Remotive:** 1 request per cycle (4/day limit)
- **Remote OK:** 1 request per cycle
- **Himalayas:** 1-2 requests per cycle (pagination if needed)
- **Working Nomads:** 1 request per cycle
- **Arbeitnow:** 1 request per cycle
- **We Work Remotely:** 1 request per cycle (RSS)
- **Jobicy:** 1 request per cycle (already implemented)
- **Hacker News:** 1 request per cycle (already implemented)

Total: ~8-10 requests per 6-hour cycle - well within reasonable limits.

---

## Notes

- All verified endpoints were tested January 31, 2026
- Salary data availability varies by source (Remotive, Remote OK, Himalayas best)
- Contract/freelance percentage estimates based on sample data analysis
- Consider deduplication across sources (same jobs may appear on multiple boards)
