alter table exams enable row level security;
alter table subjects enable row level security;
alter table topics enable row level security;
alter table questions enable row level security;
alter table profiles enable row level security;
alter table topic_progress enable row level security;
alter table tests enable row level security;
alter table attempts enable row level security;
alter table attempt_answers enable row level security;
alter table bookmarks enable row level security;

-- Reference data: readable by any logged-in user
create policy "read exams" on exams for select to authenticated using (true);
create policy "read subjects" on subjects for select to authenticated using (true);
create policy "read topics" on topics for select to authenticated using (true);
create policy "read questions" on questions for select to authenticated using (true);

-- Profiles
create policy "own profile select" on profiles for select to authenticated using (id = auth.uid());
create policy "own profile update" on profiles for update to authenticated using (id = auth.uid());

-- Topic progress
create policy "own progress all" on topic_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tests: global (user_id is null) or own
create policy "read tests" on tests for select to authenticated
  using (user_id is null or user_id = auth.uid());
create policy "insert own tests" on tests for insert to authenticated
  with check (user_id = auth.uid());

-- Attempts
create policy "own attempts all" on attempts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Attempt answers (via parent attempt ownership)
create policy "own answers all" on attempt_answers for all to authenticated
  using (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- Bookmarks
create policy "own bookmarks all" on bookmarks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
