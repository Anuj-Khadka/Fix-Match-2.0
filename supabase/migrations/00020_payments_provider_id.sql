alter table payments
  add column if not exists provider_id uuid references profiles(id) on delete set null;

create index if not exists payments_provider_id_idx on payments (provider_id);

-- Allow providers to read payments for their jobs
create policy "provider_read_own_payments"
  on payments for select
  using (auth.uid() = provider_id);
