create table if not exists payments (
  id              uuid          primary key default gen_random_uuid(),
  job_id          uuid          not null references jobs(id) on delete cascade,
  client_id       uuid          not null references profiles(id) on delete cascade,
  amount          numeric(10,2) not null,
  tip             numeric(10,2) not null default 0,
  status          text          not null default 'completed',
  transaction_ref text,
  card_last4      text,
  created_at      timestamptz   not null default now(),
  unique (job_id)
);

alter table payments enable row level security;

create policy "client_read_own_payments"
  on payments for select
  using (auth.uid() = client_id);

create policy "client_insert_own_payments"
  on payments for insert
  with check (auth.uid() = client_id);

create index if not exists payments_client_id_idx on payments (client_id);
create index if not exists payments_job_id_idx    on payments (job_id);
