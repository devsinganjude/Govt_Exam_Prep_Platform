create table activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('topic_status_change', 'practice_question', 'test_submitted')),
  created_at timestamptz not null default now(),
  unique (user_id, date, type)
);

alter table activity_log enable row level security;

create policy "own activity_log all" on activity_log for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
