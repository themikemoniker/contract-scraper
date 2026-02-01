import type { JobListing } from '../types.js';

// =============================================================================
// HTML Entity Decoding & Text Cleaning
// =============================================================================

/**
 * Common HTML entities and their replacements
 */
const HTML_ENTITIES: Record<string, string> = {
  // Named entities
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&nbsp;': ' ',
  '&ndash;': '-',
  '&mdash;': '-',
  '&lsquo;': "'",
  '&rsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&bull;': '*',
  '&hellip;': '...',
  '&copy;': '(c)',
  '&reg;': '(R)',
  '&trade;': '(TM)',
  '&euro;': 'EUR',
  '&pound;': 'GBP',
  '&yen;': 'JPY',
  '&cent;': 'c',
  '&deg;': ' degrees',
  '&plusmn;': '+/-',
  '&times;': 'x',
  '&divide;': '/',
  '&frac12;': '1/2',
  '&frac14;': '1/4',
  '&frac34;': '3/4',
};

/**
 * Decode HTML entities in text
 */
export function decodeHTMLEntities(text: string): string {
  if (!text) return '';

  let result = text;

  // Replace named entities
  for (const [entity, replacement] of Object.entries(HTML_ENTITIES)) {
    result = result.replace(new RegExp(entity, 'gi'), replacement);
  }

  // Replace numeric entities (decimal): &#123;
  result = result.replace(/&#(\d+);/g, (_, num) => {
    const code = parseInt(num, 10);
    return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
  });

  // Replace numeric entities (hex): &#x1A;
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => {
    const code = parseInt(hex, 16);
    return code > 0 && code < 65536 ? String.fromCharCode(code) : '';
  });

  return result;
}

/**
 * Strip HTML tags and clean up whitespace
 */
export function stripHTML(text: string): string {
  if (!text) return '';

  return (
    text
      // Convert common block elements to newlines
      .replace(/<\/(p|div|h[1-6]|li|tr|br)>/gi, '\n')
      .replace(/<(p|div|h[1-6]|li|tr)(\s[^>]*)?>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr\s*\/?>/gi, '\n---\n')
      // Remove all other HTML tags
      .replace(/<[^>]*>/g, '')
      // Decode HTML entities
      .replace(/&[#\w]+;/g, (entity) => {
        const decoded = decodeHTMLEntities(entity);
        return decoded !== entity ? decoded : ' ';
      })
      // Normalize whitespace
      .replace(/[ \t]+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .replace(/^\s+|\s+$/gm, '')
      .trim()
  );
}

/**
 * Clean and normalize text for display
 */
export function cleanText(text: string): string {
  if (!text) return '';

  return stripHTML(decodeHTMLEntities(text))
    .replace(/\s+/g, ' ')
    .trim();
}

// =============================================================================
// Company Name Normalization
// =============================================================================

/**
 * Common company suffixes to normalize/remove for deduplication
 */
const COMPANY_SUFFIXES = [
  // US
  'inc',
  'incorporated',
  'llc',
  'llp',
  'lp',
  'corp',
  'corporation',
  'co',
  'company',
  'limited',
  'ltd',
  'pllc',
  'pc',
  // UK
  'plc',
  // Germany
  'gmbh',
  'ag',
  'kg',
  'ohg',
  'ug',
  // Netherlands
  'bv',
  'nv',
  // France
  'sa',
  'sarl',
  'sas',
  // International
  'intl',
  'international',
  'group',
  'holdings',
  'technologies',
  'technology',
  'tech',
  'labs',
  'studio',
  'studios',
  'software',
  'solutions',
  'systems',
  'services',
  'consulting',
];

/**
 * Normalize company name for display (light cleanup)
 */
export function cleanCompanyName(name: string | null): string {
  if (!name) return '';

  return (
    name
      // Decode HTML entities
      .replace(/&[#\w]+;/g, (entity) => decodeHTMLEntities(entity))
      // Normalize whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

/**
 * Normalize company name for deduplication (aggressive normalization)
 */
export function normalizeCompanyName(name: string | null): string {
  if (!name) return '';

  let normalized = name.toLowerCase().trim();

  // Remove common suffixes (with optional punctuation)
  const suffixPattern = new RegExp(
    `\\b(${COMPANY_SUFFIXES.join('|')})\\.?\\s*$`,
    'gi'
  );

  // Apply suffix removal multiple times to handle "Company Inc. LLC"
  for (let i = 0; i < 3; i++) {
    normalized = normalized.replace(suffixPattern, '').trim();
  }

  // Remove special characters but keep alphanumeric
  normalized = normalized
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '')
    .trim();

  return normalized;
}

// =============================================================================
// Salary Extraction
// =============================================================================

interface ExtractedSalary {
  min: number | null;
  max: number | null;
  currency: string;
  type: 'hourly' | 'yearly' | 'fixed';
}

/**
 * Salary patterns to detect in job descriptions
 */
const SALARY_PATTERNS = [
  // $100k - $150k, $100K-150K, $100,000 - $150,000
  {
    pattern:
      /\$\s*([\d,]+)\s*k?\s*[-–—to]+\s*\$?\s*([\d,]+)\s*k?\s*(?:per\s+)?(year|yr|annual|annually|hour|hr|hourly)?/gi,
    handler: (match: RegExpExecArray): ExtractedSalary => {
      let min = parseFloat(match[1]!.replace(/,/g, ''));
      let max = parseFloat(match[2]!.replace(/,/g, ''));
      const typeHint = (match[3] ?? '').toLowerCase();

      // If numbers are small and followed by 'k', multiply by 1000
      if (match[0]!.toLowerCase().includes('k')) {
        if (min < 1000) min *= 1000;
        if (max < 1000) max *= 1000;
      }

      const isHourly = typeHint.includes('hour') || typeHint.includes('hr');

      return {
        min,
        max,
        currency: 'USD',
        type: isHourly ? 'hourly' : 'yearly',
      };
    },
  },
  // $100k+, $150K+
  {
    pattern: /\$\s*([\d,]+)\s*k?\s*\+\s*(?:per\s+)?(year|yr|annual|hour|hr)?/gi,
    handler: (match: RegExpExecArray): ExtractedSalary => {
      let min = parseFloat(match[1]!.replace(/,/g, ''));
      const typeHint = (match[2] ?? '').toLowerCase();

      if (match[0]!.toLowerCase().includes('k') && min < 1000) {
        min *= 1000;
      }

      const isHourly = typeHint.includes('hour') || typeHint.includes('hr');

      return {
        min,
        max: null,
        currency: 'USD',
        type: isHourly ? 'hourly' : 'yearly',
      };
    },
  },
  // EUR 80,000 - 120,000 or 80.000 EUR - 120.000 EUR
  {
    pattern:
      /(?:EUR|€)\s*([\d.,]+)\s*[-–—to]+\s*(?:EUR|€)?\s*([\d.,]+)\s*(?:per\s+)?(year|annual|month)?/gi,
    handler: (match: RegExpExecArray): ExtractedSalary => {
      // European format uses . for thousands and , for decimals
      const min = parseFloat(match[1]!.replace(/\./g, '').replace(',', '.'));
      const max = parseFloat(match[2]!.replace(/\./g, '').replace(',', '.'));

      return {
        min,
        max,
        currency: 'EUR',
        type: 'yearly',
      };
    },
  },
  // GBP/£ patterns
  {
    pattern:
      /(?:GBP|£)\s*([\d,]+)\s*k?\s*[-–—to]+\s*(?:GBP|£)?\s*([\d,]+)\s*k?\s*(?:per\s+)?(year|annual)?/gi,
    handler: (match: RegExpExecArray): ExtractedSalary => {
      let min = parseFloat(match[1]!.replace(/,/g, ''));
      let max = parseFloat(match[2]!.replace(/,/g, ''));

      if (match[0]!.toLowerCase().includes('k')) {
        if (min < 1000) min *= 1000;
        if (max < 1000) max *= 1000;
      }

      return {
        min,
        max,
        currency: 'GBP',
        type: 'yearly',
      };
    },
  },
  // Hourly rate: $50/hr, $75 per hour, $50-75/hour
  {
    pattern:
      /\$\s*([\d,]+)\s*(?:[-–—to]+\s*\$?\s*([\d,]+)\s*)?(?:\/|\s+per\s+)(hr|hour)/gi,
    handler: (match: RegExpExecArray): ExtractedSalary => {
      const min = parseFloat(match[1]!.replace(/,/g, ''));
      const max = match[2] ? parseFloat(match[2].replace(/,/g, '')) : null;

      return {
        min,
        max,
        currency: 'USD',
        type: 'hourly',
      };
    },
  },
];

/**
 * Extract salary information from job description text
 */
export function extractSalaryFromText(text: string): ExtractedSalary | null {
  if (!text) return null;

  for (const { pattern, handler } of SALARY_PATTERNS) {
    // Reset lastIndex for global patterns
    pattern.lastIndex = 0;
    const match = pattern.exec(text);

    if (match) {
      try {
        const result = handler(match);

        // Validate extracted values
        if (result.min !== null && (result.min < 0 || result.min > 10000000)) {
          continue; // Skip unreasonable values
        }
        if (result.max !== null && (result.max < 0 || result.max > 10000000)) {
          continue;
        }
        if (result.min !== null && result.max !== null && result.min > result.max) {
          // Swap if min > max
          [result.min, result.max] = [result.max, result.min];
        }

        return result;
      } catch {
        continue;
      }
    }
  }

  return null;
}

// =============================================================================
// Tech Stack Detection
// =============================================================================

// Tech stack detection patterns
const TECH_PATTERNS: Record<string, RegExp> = {
  // Languages
  javascript: /\b(javascript|js)\b/i,
  typescript: /\b(typescript|ts)\b/i,
  python: /\bpython\b/i,
  rust: /\brust\b/i,
  go: /\b(golang|go\s+programming|go\s+developer)\b/i,
  java: /\bjava\b(?!\s*script)/i,
  'c++': /\b(c\+\+|cpp)\b/i,
  'c#': /\b(c#|csharp|\.net)\b/i,
  ruby: /\bruby\b/i,
  php: /\bphp\b/i,
  swift: /\bswift\b/i,
  kotlin: /\bkotlin\b/i,
  scala: /\bscala\b/i,
  elixir: /\belixir\b/i,
  haskell: /\bhaskell\b/i,
  clojure: /\bclojure\b/i,
  erlang: /\berlang\b/i,
  zig: /\bzig\b/i,
  nim: /\bnim\b/i,
  ocaml: /\bocaml\b/i,
  fsharp: /\bf#\b/i,
  lua: /\blua\b/i,
  perl: /\bperl\b/i,
  r: /\b(r\s+programming|r\s+language|rstats)\b/i,
  julia: /\bjulia\b/i,
  dart: /\bdart\b/i,
  objectivec: /\b(objective[\s-]?c|objc)\b/i,
  cobol: /\bcobol\b/i,
  fortran: /\bfortran\b/i,

  // Frontend frameworks
  react: /\breact(\.?js)?\b/i,
  vue: /\bvue(\.?js)?\b/i,
  angular: /\bangular\b/i,
  svelte: /\bsvelte\b/i,
  nextjs: /\bnext\.?js\b/i,
  nuxt: /\bnuxt\b/i,
  remix: /\bremix\b/i,
  astro: /\bastro\b/i,
  gatsby: /\bgatsby\b/i,
  solidjs: /\bsolid\.?js\b/i,
  qwik: /\bqwik\b/i,
  htmx: /\bhtmx\b/i,
  alpinejs: /\balpine\.?js\b/i,
  ember: /\bember(\.?js)?\b/i,
  backbone: /\bbackbone(\.?js)?\b/i,
  jquery: /\bjquery\b/i,

  // Backend frameworks
  nodejs: /\bnode(\.?js)?\b/i,
  express: /\bexpress(\.?js)?\b/i,
  fastify: /\bfastify\b/i,
  nestjs: /\bnest\.?js\b/i,
  hono: /\bhono\b/i,
  django: /\bdjango\b/i,
  flask: /\bflask\b/i,
  fastapi: /\bfastapi\b/i,
  rails: /\brails\b/i,
  laravel: /\blaravel\b/i,
  spring: /\bspring(\s*boot)?\b/i,
  aspnet: /\basp\.?net\b/i,
  gin: /\bgin\s*(framework|golang)?\b/i,
  fiber: /\bfiber\s*(go)?\b/i,
  echo: /\becho\s*(go|framework)\b/i,
  actix: /\bactix\b/i,
  axum: /\baxum\b/i,
  rocket: /\brocket\s*(rust)?\b/i,
  phoenix: /\bphoenix\s*(framework|elixir)?\b/i,
  sinatra: /\bsinatra\b/i,
  koa: /\bkoa(\.?js)?\b/i,
  hapi: /\bhapi\b/i,
  adonisjs: /\badonis\.?js\b/i,

  // Databases
  postgresql: /\b(postgres(ql)?|psql)\b/i,
  mysql: /\bmysql\b/i,
  mongodb: /\b(mongodb|mongo)\b/i,
  redis: /\bredis\b/i,
  elasticsearch: /\belasticsearch\b/i,
  dynamodb: /\bdynamodb\b/i,
  sqlite: /\bsqlite\b/i,
  supabase: /\bsupabase\b/i,
  cassandra: /\bcassandra\b/i,
  couchdb: /\bcouchdb\b/i,
  neo4j: /\bneo4j\b/i,
  mariadb: /\bmariadb\b/i,
  oracle: /\boracle\s*(db|database)?\b/i,
  sqlserver: /\b(sql\s*server|mssql)\b/i,
  cockroachdb: /\bcockroach\s*db\b/i,
  planetscale: /\bplanetscale\b/i,
  fauna: /\bfauna\s*(db)?\b/i,
  firestore: /\bfirestore\b/i,
  prisma: /\bprisma\b/i,
  drizzle: /\bdrizzle\s*(orm)?\b/i,
  typeorm: /\btypeorm\b/i,
  sequelize: /\bsequelize\b/i,
  knex: /\bknex\b/i,
  clickhouse: /\bclickhouse\b/i,
  timescaledb: /\btimescale\s*db\b/i,
  influxdb: /\binflux\s*db\b/i,

  // Cloud/DevOps
  aws: /\b(aws|amazon\s*web\s*services)\b/i,
  gcp: /\b(gcp|google\s*cloud)\b/i,
  azure: /\bazure\b/i,
  docker: /\bdocker\b/i,
  kubernetes: /\b(kubernetes|k8s)\b/i,
  terraform: /\bterraform\b/i,
  ansible: /\bansible\b/i,
  jenkins: /\bjenkins\b/i,
  'github-actions': /\bgithub\s*actions\b/i,
  circleci: /\bcircleci\b/i,
  gitlab: /\bgitlab(\s*ci)?\b/i,
  vercel: /\bvercel\b/i,
  netlify: /\bnetlify\b/i,
  cloudflare: /\bcloudflare(\s*workers)?\b/i,
  heroku: /\bheroku\b/i,
  digitalocean: /\bdigital\s*ocean\b/i,
  linode: /\blinode\b/i,
  fly: /\bfly\.io\b/i,
  railway: /\brailway\b/i,
  render: /\brender\.com\b/i,
  pulumi: /\bpulumi\b/i,
  helm: /\bhelm\b/i,
  argocd: /\bargo\s*cd\b/i,
  prometheus: /\bprometheus\b/i,
  grafana: /\bgrafana\b/i,
  datadog: /\bdatadog\b/i,
  newrelic: /\bnew\s*relic\b/i,
  sentry: /\bsentry\b/i,
  pagerduty: /\bpagerduty\b/i,
  nginx: /\bnginx\b/i,
  apache: /\bapache\s*(http|server)?\b/i,
  caddy: /\bcaddy\b/i,
  traefik: /\btraefik\b/i,

  // AI/ML
  pytorch: /\bpytorch\b/i,
  tensorflow: /\btensorflow\b/i,
  llm: /\b(llm|large\s*language\s*model|gpt|openai|anthropic|claude)\b/i,
  'machine-learning': /\b(machine\s*learning|ml)\b/i,
  keras: /\bkeras\b/i,
  scikit: /\bscikit[\s-]?learn\b/i,
  pandas: /\bpandas\b/i,
  numpy: /\bnumpy\b/i,
  jupyter: /\bjupyter\b/i,
  huggingface: /\bhugging\s*face\b/i,
  langchain: /\blangchain\b/i,
  'vector-db': /\b(pinecone|weaviate|qdrant|milvus|chroma\s*db)\b/i,
  mlops: /\bmlops\b/i,
  opencv: /\bopencv\b/i,
  spark: /\b(apache\s*)?spark\b/i,
  airflow: /\b(apache\s*)?airflow\b/i,
  dbt: /\bdbt\b/i,
  snowflake: /\bsnowflake\b/i,
  databricks: /\bdatabricks\b/i,
  ray: /\bray\s*(framework)?\b/i,
  rag: /\b(rag|retrieval[\s-]augmented[\s-]generation)\b/i,

  // Mobile
  'react-native': /\breact[\s-]*native\b/i,
  flutter: /\bflutter\b/i,
  ios: /\bios\b/i,
  android: /\bandroid\b/i,
  swiftui: /\bswiftui\b/i,
  jetpack: /\bjetpack\s*compose\b/i,
  xamarin: /\bxamarin\b/i,
  capacitor: /\bcapacitor\b/i,
  ionic: /\bionic\b/i,
  expo: /\bexpo\b/i,

  // Web3/Blockchain
  solidity: /\bsolidity\b/i,
  web3: /\bweb3\b/i,
  ethereum: /\bethereum\b/i,
  blockchain: /\bblockchain\b/i,
  hardhat: /\bhardhat\b/i,
  foundry: /\bfoundry\b/i,
  solana: /\bsolana\b/i,
  cosmwasm: /\bcosmwasm\b/i,
  substrate: /\bsubstrate\b/i,
  polkadot: /\bpolkadot\b/i,

  // Messaging/Queues
  kafka: /\b(apache\s*)?kafka\b/i,
  rabbitmq: /\brabbitmq\b/i,
  sqs: /\b(aws\s*)?sqs\b/i,
  pubsub: /\b(pub\s*sub|google\s*pub\s*sub)\b/i,
  nats: /\bnats\b/i,
  zeromq: /\b(zeromq|zmq)\b/i,
  celery: /\bcelery\b/i,
  bullmq: /\bbull\s*mq\b/i,

  // Testing
  jest: /\bjest\b/i,
  cypress: /\bcypress\b/i,
  playwright: /\bplaywright\b/i,
  selenium: /\bselenium\b/i,
  pytest: /\bpytest\b/i,
  rspec: /\brspec\b/i,
  mocha: /\bmocha\b/i,
  vitest: /\bvitest\b/i,

  // Other
  graphql: /\bgraphql\b/i,
  rest: /\b(rest\s*api|restful)\b/i,
  grpc: /\bgrpc\b/i,
  websocket: /\bwebsocket\b/i,
  tailwind: /\btailwindcss?\b/i,
  sass: /\b(sass|scss)\b/i,
  webpack: /\bwebpack\b/i,
  vite: /\bvite\b/i,
  esbuild: /\besbuild\b/i,
  rollup: /\brollup\b/i,
  parcel: /\bparcel\b/i,
  turbo: /\bturbo(repo|pack)?\b/i,
  bun: /\bbun\b/i,
  deno: /\bdeno\b/i,
  storybook: /\bstorybook\b/i,
  figma: /\bfigma\b/i,
  git: /\bgit\b/i,
  linux: /\blinux\b/i,
  unix: /\bunix\b/i,
  bash: /\bbash\b/i,
  zsh: /\bzsh\b/i,
  vim: /\b(neo)?vim\b/i,
  emacs: /\bemacs\b/i,
  vscode: /\bvs\s*code\b/i,
  oauth: /\boauth\b/i,
  jwt: /\bjwt\b/i,
  saml: /\bsaml\b/i,
  sso: /\bsso\b/i,
  stripe: /\bstripe\b/i,
  twilio: /\btwilio\b/i,
  sendgrid: /\bsendgrid\b/i,
  segment: /\bsegment\b/i,
  amplitude: /\bamplitude\b/i,
  mixpanel: /\bmixpanel\b/i,
};

// Experience level patterns
const EXPERIENCE_PATTERNS = {
  junior: /\b(junior|entry[\s-]*level|0-2\s*years?|1-2\s*years?|new\s*grad|graduate)\b/i,
  mid: /\b(mid[\s-]*level|intermediate|3-5\s*years?|2-4\s*years?)\b/i,
  senior: /\b(senior|sr\.?|5\+?\s*years?|6\+?\s*years?|7\+?\s*years?|experienced)\b/i,
  lead: /\b(lead|principal|staff|architect|manager|director|head\s*of)\b/i,
};

// Contract type patterns
const CONTRACT_PATTERNS = {
  'full-time': /\b(full[\s-]*time|permanent|fte)\b/i,
  'part-time': /\b(part[\s-]*time)\b/i,
  contract: /\b(contract|contractor|c2c|corp[\s-]*to[\s-]*corp)\b/i,
  freelance: /\b(freelance|freelancer|gig|project[\s-]*based)\b/i,
};

/**
 * Extract tech stack from text (job title + description)
 */
export function extractTechStack(text: string): string[] {
  const detected: string[] = [];

  for (const [tech, pattern] of Object.entries(TECH_PATTERNS)) {
    if (pattern.test(text)) {
      detected.push(tech);
    }
  }

  return detected;
}

/**
 * Detect experience level from text
 */
export function detectExperienceLevel(
  text: string
): 'junior' | 'mid' | 'senior' | 'lead' | null {
  // Check in order of seniority (lead first, junior last)
  if (EXPERIENCE_PATTERNS.lead.test(text)) return 'lead';
  if (EXPERIENCE_PATTERNS.senior.test(text)) return 'senior';
  if (EXPERIENCE_PATTERNS.mid.test(text)) return 'mid';
  if (EXPERIENCE_PATTERNS.junior.test(text)) return 'junior';

  return null;
}

/**
 * Detect contract type from text
 */
export function detectContractType(
  text: string
): 'full-time' | 'part-time' | 'contract' | 'freelance' | null {
  if (CONTRACT_PATTERNS.freelance.test(text)) return 'freelance';
  if (CONTRACT_PATTERNS.contract.test(text)) return 'contract';
  if (CONTRACT_PATTERNS['part-time'].test(text)) return 'part-time';
  if (CONTRACT_PATTERNS['full-time'].test(text)) return 'full-time';

  return null;
}

/**
 * Normalize job title for deduplication
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculate simple Levenshtein distance ratio (0-1)
 */
export function similarityScore(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Simple containment check for short strings
  if (a.includes(b) || b.includes(a)) {
    return 0.9;
  }

  const matrix: number[][] = [];

  for (let i = 0; i <= a.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    matrix[0]![j] = j;
  }

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i]![j] = Math.min(
        matrix[i - 1]![j]! + 1,
        matrix[i]![j - 1]! + 1,
        matrix[i - 1]![j - 1]! + cost
      );
    }
  }

  const distance = matrix[a.length]![b.length]!;
  const maxLength = Math.max(a.length, b.length);

  return 1 - distance / maxLength;
}

// =============================================================================
// Location Normalization
// =============================================================================

/**
 * Normalize location string for consistency
 */
export function normalizeLocation(location: string | null): string | null {
  if (!location) return null;

  let normalized = location.trim();

  // Decode HTML entities
  normalized = decodeHTMLEntities(normalized);

  // Common remote variations
  if (/\b(remote|anywhere|worldwide|global|distributed)\b/i.test(normalized)) {
    // Keep the original but clean it up
    normalized = normalized.replace(/\s+/g, ' ').trim();
  }

  // Normalize US state abbreviations
  const usStates: Record<string, string> = {
    'california': 'CA',
    'new york': 'NY',
    'texas': 'TX',
    'florida': 'FL',
    'washington': 'WA',
    'colorado': 'CO',
    'massachusetts': 'MA',
    'illinois': 'IL',
    'georgia': 'GA',
    'north carolina': 'NC',
    'pennsylvania': 'PA',
    'oregon': 'OR',
    'arizona': 'AZ',
    'virginia': 'VA',
    'ohio': 'OH',
    'michigan': 'MI',
    'utah': 'UT',
    'minnesota': 'MN',
  };

  for (const [full, abbrev] of Object.entries(usStates)) {
    const regex = new RegExp(`\\b${full}\\b`, 'gi');
    normalized = normalized.replace(regex, abbrev);
  }

  return normalized || null;
}

// =============================================================================
// Main Cleaning Function
// =============================================================================

/**
 * Clean and enrich a job listing with improved data quality
 *
 * This function:
 * 1. Strips HTML and decodes entities from description
 * 2. Cleans and normalizes company name
 * 3. Extracts salary from description if not already present
 * 4. Detects tech stack, experience level, and contract type
 * 5. Normalizes location
 *
 * @param job - The job listing to clean
 * @returns A new job listing with cleaned/enriched data
 */
export function cleanJobListing(job: JobListing): JobListing {
  // Clean description - strip HTML and decode entities
  const cleanedDescription = job.description ? stripHTML(job.description) : null;

  // Clean company name for display
  const cleanedCompany = job.company ? cleanCompanyName(job.company) : null;

  // Clean title
  const cleanedTitle = job.title ? cleanText(job.title) : job.title;

  // Try to extract salary from description if not already present
  let salaryMin = job.salary_min;
  let salaryMax = job.salary_max;
  let salaryCurrency = job.salary_currency;
  let salaryType = job.salary_type;

  if (salaryMin === null && cleanedDescription) {
    const extractedSalary = extractSalaryFromText(cleanedDescription);
    if (extractedSalary) {
      salaryMin = extractedSalary.min;
      salaryMax = extractedSalary.max;
      salaryCurrency = extractedSalary.currency;
      salaryType = extractedSalary.type;
    }
  }

  // Extract tech stack from title + description
  const textForAnalysis = `${cleanedTitle || ''} ${cleanedDescription || ''}`;
  const detectedTechStack = extractTechStack(textForAnalysis);

  // Merge with existing tech stack (remove duplicates)
  const mergedTechStack = [...new Set([...job.tech_stack, ...detectedTechStack])];

  // Detect experience level if not set
  const experienceLevel =
    job.experience_level ?? detectExperienceLevel(textForAnalysis);

  // Detect contract type if not set
  const contractType = job.contract_type ?? detectContractType(textForAnalysis);

  // Normalize location
  const normalizedLocation = normalizeLocation(job.location);

  return {
    ...job,
    title: cleanedTitle,
    company: cleanedCompany,
    description: cleanedDescription,
    salary_min: salaryMin,
    salary_max: salaryMax,
    salary_currency: salaryCurrency,
    salary_type: salaryType,
    tech_stack: mergedTechStack,
    experience_level: experienceLevel,
    contract_type: contractType,
    location: normalizedLocation,
  };
}

/**
 * Clean a batch of job listings
 *
 * @param jobs - Array of job listings to clean
 * @returns Array of cleaned job listings
 */
export function cleanJobListings(jobs: JobListing[]): JobListing[] {
  console.log(`[Enrich] Cleaning ${jobs.length} job listings...`);

  const cleaned = jobs.map((job) => cleanJobListing(job));

  // Log some stats
  const withSalary = cleaned.filter((j) => j.salary_min !== null).length;
  const withTechStack = cleaned.filter((j) => j.tech_stack.length > 0).length;

  console.log(`[Enrich] Results: ${withSalary} with salary, ${withTechStack} with tech stack`);

  return cleaned;
}
