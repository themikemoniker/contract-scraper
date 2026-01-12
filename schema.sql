-- Enable pgcrypto for gen_random_uuid()
create extension if not exists "pgcrypto";

-- Create the canonical job_listings table
create table job_listings (
  id uuid primary key default gen_random_uuid(),
  
  -- Core natural composite key
  platform text not null,
  external_id text not null,
  
  -- Human-readable core
  title text not null,
  description text,
  url text,
  
  -- Pricing Fields
  hourly_rate_min numeric,
  hourly_rate_max numeric,
  fixed_price numeric,
  
  -- Client Metadata
  client_payment_verified boolean,
  client_total_spent numeric,
  client_country text,
  
  -- Skills
  skills text[],
  
  -- Raw payload (Critical: Never throw info away)
  raw jsonb not null,
  
  -- Timestamps
  posted_at timestamptz,
  fetched_at timestamptz default now(),
  
  -- Uniqueness Constraint
  unique (platform, external_id)
);
