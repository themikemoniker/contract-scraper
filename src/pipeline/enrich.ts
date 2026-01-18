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

  // Frontend frameworks
  react: /\breact(\.?js)?\b/i,
  vue: /\bvue(\.?js)?\b/i,
  angular: /\bangular\b/i,
  svelte: /\bsvelte\b/i,
  nextjs: /\bnext\.?js\b/i,
  nuxt: /\bnuxt\b/i,
  remix: /\bremix\b/i,
  astro: /\bastro\b/i,

  // Backend frameworks
  nodejs: /\bnode(\.?js)?\b/i,
  express: /\bexpress(\.?js)?\b/i,
  fastify: /\bfastify\b/i,
  django: /\bdjango\b/i,
  flask: /\bflask\b/i,
  fastapi: /\bfastapi\b/i,
  rails: /\brails\b/i,
  laravel: /\blaravel\b/i,
  spring: /\bspring(\s*boot)?\b/i,

  // Databases
  postgresql: /\b(postgres(ql)?|psql)\b/i,
  mysql: /\bmysql\b/i,
  mongodb: /\b(mongodb|mongo)\b/i,
  redis: /\bredis\b/i,
  elasticsearch: /\belasticsearch\b/i,
  dynamodb: /\bdynamodb\b/i,
  sqlite: /\bsqlite\b/i,
  supabase: /\bsupabase\b/i,

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

  // AI/ML
  pytorch: /\bpytorch\b/i,
  tensorflow: /\btensorflow\b/i,
  llm: /\b(llm|large\s*language\s*model|gpt|openai|anthropic|claude)\b/i,
  'machine-learning': /\b(machine\s*learning|ml)\b/i,

  // Mobile
  'react-native': /\breact[\s-]*native\b/i,
  flutter: /\bflutter\b/i,
  ios: /\bios\b/i,
  android: /\bandroid\b/i,

  // Web3/Blockchain
  solidity: /\bsolidity\b/i,
  web3: /\bweb3\b/i,
  ethereum: /\bethereum\b/i,
  blockchain: /\bblockchain\b/i,

  // Other
  graphql: /\bgraphql\b/i,
  rest: /\b(rest\s*api|restful)\b/i,
  grpc: /\bgrpc\b/i,
  websocket: /\bwebsocket\b/i,
  tailwind: /\btailwindcss?\b/i,
  sass: /\b(sass|scss)\b/i,
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
 * Normalize company name for deduplication
 */
export function normalizeCompanyName(name: string | null): string {
  if (!name) return '';

  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
    .replace(/\b(inc|llc|ltd|corp|company|co|gmbh|bv|sa|ag)\b/g, '') // Remove suffixes
    .trim();
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
