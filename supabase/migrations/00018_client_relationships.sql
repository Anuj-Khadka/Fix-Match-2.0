-- Provider-specific notes and tags per client (CRM data)
create table if not exists client_relationships (
  id          uuid        primary key default gen_random_uuid(),
  provider_id uuid        not null references profiles(id) on delete cascade,
  client_id   uuid        not null references profiles(id) on delete cascade,
  notes       text        not null default '',
  tags        text[]      not null default '{}',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (provider_id, client_id)
);

alter table client_relationships enable row level security;

create policy "provider_crm_all"
  on client_relationships
  for all
  using  (auth.uid() = provider_id)
  with check (auth.uid() = provider_id);

create index if not exists client_relationships_provider_idx
  on client_relationships (provider_id);

create or replace function _touch_client_relationships()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_client_relationships_updated_at
  before update on client_relationships
  for each row execute function _touch_client_relationships();
