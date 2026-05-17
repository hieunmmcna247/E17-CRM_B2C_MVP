-- New lead rows: generate id when the client does not send one.
-- Run this in Supabase → SQL Editor if inserts still fail without an explicit id.
alter table public.leads
  alter column id set default gen_random_uuid();
