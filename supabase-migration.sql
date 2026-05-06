-- Raio-X Engine: Supabase migration
-- Run this in Supabase SQL Editor

-- audits table
create table audits (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Input
  clinic_url text not null,
  clinic_name text,
  city text,
  tier int check (tier between 1 and 4),

  -- Automated findings (populated by backend pipeline)
  pagespeed_mobile int,
  pagespeed_desktop int,
  page_load_seconds numeric(4,2),
  whatsapp_clicks int,
  cases_present boolean,
  cro_visible boolean,
  problematic_words jsonb default '[]'::jsonb,

  -- Raw data (for re-prompting & debugging)
  raw_html_excerpt text,
  raw_pagespeed jsonb,

  -- Manual findings (filled by Domingos in UI)
  gbp_photos int,
  gbp_last_reply_date date,
  gbp_implant_featured boolean,
  meta_ads_count int,
  meta_ads_violations jsonb default '[]'::jsonb,
  whatsapp_response_minutes int,

  -- Output
  best_reel_template text,
  filmable_script text,
  full_audit_report text,

  -- Workflow
  status text default 'auditing' check (status in
    ('auditing','automated_done','manual_pending','complete','pushed_to_notion','failed')),
  notion_page_id text,
  recording_path text,
  used_in_reel_id text,
  created_by uuid references auth.users(id)
);

create index audits_created_at_idx on audits(created_at desc);
create index audits_status_idx on audits(status);

-- batch_runs table
create table batch_runs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  url_count int not null,
  completed_count int default 0,
  failed_count int default 0,
  status text default 'running' check (status in ('running','complete','partial','failed')),
  audit_ids uuid[] default array[]::uuid[],
  created_by uuid references auth.users(id)
);

-- RLS policies
alter table audits enable row level security;
create policy "owner reads own audits" on audits for select using (auth.uid() = created_by);
create policy "owner writes own audits" on audits for insert with check (auth.uid() = created_by);
create policy "owner updates own audits" on audits for update using (auth.uid() = created_by);

alter table batch_runs enable row level security;
create policy "owner reads own batches" on batch_runs for select using (auth.uid() = created_by);
create policy "owner writes own batches" on batch_runs for insert with check (auth.uid() = created_by);
create policy "owner updates own batches" on batch_runs for update using (auth.uid() = created_by);
