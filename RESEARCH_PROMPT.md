# Job Source Research Prompt

Use this prompt with a new Claude instance to research potential job sources:

---

I'm building a job aggregator for **software engineering contractor/freelance opportunities**. The system automatically fetches jobs every 6 hours via GitHub Actions, so sources must be accessible programmatically without human interaction.

## Current Sources

1. **Hacker News** - "Who is Hiring?" monthly threads via HN Algolia API
2. **Jobicy** - Remote tech jobs via public API (has salary data)
3. **Himalayas** - Remote jobs via public API (timezone/location filters)
4. **We Work Remotely** - RSS feed

## Requirements for New Sources

### Must Have
- **Programmatic access** - Public API, RSS/Atom feed, or scrapable endpoint (no authentication preferred)
- **No rate limiting issues** - Should support fetching 50-200+ jobs per request
- **Contractor/freelance focus** - Or at least includes contract positions (not just full-time W2)
- **Tech/software engineering** - SWE, DevOps, data engineering, etc.
- **Active listings** - Jobs posted within last 30 days
- **Stable endpoint** - Won't disappear or change frequently

### Nice to Have
- Salary/rate information
- Remote-first or location-flexible jobs
- Structured data (JSON API better than HTML scraping)
- Tech stack tags or keywords in descriptions
- No CAPTCHA or bot protection
- Free tier that allows automated access

### Deal Breakers
- Requires login/authentication (unless free API key)
- Aggressive rate limiting (< 100 requests/day)
- Only full-time W2 positions
- Paywalled job details
- Heavy JavaScript rendering (if scraping)
- CAPTCHA protection

## Your Task

Research and recommend **5-10 job sources** that meet the above criteria. For each source, provide:

1. **Source Name & URL**
2. **Access Method** - API endpoint, RSS feed URL, or scraping approach
3. **Data Quality** - What fields are available (title, company, salary, description, etc.)
4. **Contractor Focus** - % of listings that are contract/freelance vs full-time
5. **Volume** - Approximate number of active SWE jobs
6. **Auth Requirements** - None, free API key, or paid
7. **Rate Limits** - If applicable
8. **Code Example** - Brief fetch example (curl or TypeScript/Node.js)
9. **Pros/Cons** - Why this source is valuable and any limitations

## Prioritize

Focus on sources with:
- High-quality contractor/freelance opportunities (not just full-time)
- Good salary/rate transparency
- Active communities or job boards
- APIs or feeds (avoid complex scraping)

## Examples of What I'm Looking For

- Upwork public RSS (if available)
- Toptal blog/feed
- Reddit /r/forhire (if accessible via API)
- AngelList/Wellfound API
- Remote OK API
- Gun.io feed
- Authentic Jobs API
- Stack Overflow Jobs replacement (if exists)
- Tech-specific Discord/Slack job boards with public webhooks

## Output Format

Provide a markdown table with columns:
| Source | Access Method | Contractor % | Volume | Auth | Why Recommended |

Then provide detailed implementation notes for the top 3-5 sources.

---

**Important**: Only recommend sources you've verified are currently active and accessible. Include actual URLs/endpoints, not hypothetical ones.
