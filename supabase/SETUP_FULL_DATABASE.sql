-- ========================================================
-- STEP 1: INITIAL SCHEMA & TABLES
-- ========================================================
create extension if not exists "pgcrypto";

create table if not exists exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'en',
  total_marks int not null,
  marks_per_question numeric not null default 1,
  negative_marking numeric not null default 0.25,
  created_at timestamptz not null default now()
);

create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  weightage numeric,
  sort_order int not null default 0
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  question_text text not null,
  options jsonb not null,
  correct_option int not null check (correct_option between 0 and 3),
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  year int,
  source text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_questions_topic_id on questions(topic_id);

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  target_exam_id uuid references exams(id),
  daily_goal_hours numeric not null default 4,
  exam_date date,
  created_at timestamptz not null default now()
);

create table if not exists topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  status text not null default 'not_started' check (status in ('not_started','in_progress','done')),
  revision_stage int not null default 0,
  last_revised_at timestamptz,
  next_revision_at timestamptz,
  unique (user_id, topic_id)
);

create table if not exists tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  exam_id uuid not null references exams(id),
  title text not null,
  duration_min int not null,
  question_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric,
  time_taken_sec int,
  status text not null default 'in_progress' check (status in ('in_progress','submitted'))
);

create table if not exists attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  selected_option int check (selected_option between 0 and 3),
  marked_for_review boolean not null default false,
  time_spent_sec int not null default 0,
  is_correct boolean,
  unique (attempt_id, question_id)
);

create table if not exists bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  note_text text,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  type text not null check (type in ('topic_status_change', 'practice_question', 'test_submitted')),
  created_at timestamptz not null default now(),
  unique (user_id, date, type)
);

-- Auto-create a profile on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

-- ========================================================
-- STEP 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
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
alter table activity_log enable row level security;

-- Reference data: readable by any logged-in user
drop policy if exists "read exams" on exams;
create policy "read exams" on exams for select to authenticated using (true);

drop policy if exists "read subjects" on subjects;
create policy "read subjects" on subjects for select to authenticated using (true);

drop policy if exists "read topics" on topics;
create policy "read topics" on topics for select to authenticated using (true);

drop policy if exists "read questions" on questions;
create policy "read questions" on questions for select to authenticated using (true);

-- Profiles
drop policy if exists "own profile select" on profiles;
create policy "own profile select" on profiles for select to authenticated using (id = auth.uid());

drop policy if exists "own profile update" on profiles;
create policy "own profile update" on profiles for update to authenticated using (id = auth.uid());

-- Topic progress
drop policy if exists "own progress all" on topic_progress;
create policy "own progress all" on topic_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Tests
drop policy if exists "read tests" on tests;
create policy "read tests" on tests for select to authenticated
  using (user_id is null or user_id = auth.uid());

drop policy if exists "insert own tests" on tests;
create policy "insert own tests" on tests for insert to authenticated
  with check (user_id = auth.uid());

-- Attempts
drop policy if exists "own attempts all" on attempts;
create policy "own attempts all" on attempts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Attempt answers
drop policy if exists "own answers all" on attempt_answers;
create policy "own answers all" on attempt_answers for all to authenticated
  using (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()))
  with check (exists (select 1 from attempts a where a.id = attempt_id and a.user_id = auth.uid()));

-- Bookmarks
drop policy if exists "own bookmarks all" on bookmarks;
create policy "own bookmarks all" on bookmarks for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Activity log
drop policy if exists "own activity_log all" on activity_log;
create policy "own activity_log all" on activity_log for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ========================================================
-- STEP 3: SEED DATA
-- ========================================================
insert into exams (id, name, total_marks, marks_per_question, negative_marking)
values ('11111111-1111-1111-1111-111111111111', 'MPSC Combined Prelims', 100, 2, 0.25)
on conflict (id) do nothing;

insert into subjects (id, exam_id, name, sort_order) values
('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'History', 1),
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Geography', 2),
('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Polity', 3),
('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Economy', 4),
('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 'Science and Technology', 5),
('22222222-2222-2222-2222-222222222226', '11111111-1111-1111-1111-111111111111', 'Environment', 6),
('22222222-2222-2222-2222-222222222227', '11111111-1111-1111-1111-111111111111', 'Current Affairs', 7),
('22222222-2222-2222-2222-222222222228', '11111111-1111-1111-1111-111111111111', 'CSAT', 8)
on conflict (id) do nothing;

insert into topics (id, subject_id, name, sort_order) values
('33333333-3333-3333-3333-333333333331', '22222222-2222-2222-2222-222222222223', 'Constitution Basics', 1),
('33333333-3333-3333-3333-333333333332', '22222222-2222-2222-2222-222222222223', 'Fundamental Rights', 2),
('33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222223', 'Parliament', 3),
('33333333-3333-3333-3333-333333333334', '22222222-2222-2222-2222-222222222223', 'Local Self Government', 4)
on conflict (id) do nothing;

insert into questions (id, topic_id, question_text, options, correct_option, explanation, difficulty, source, verified) values
('44444444-4444-4444-4444-444444444441', '33333333-3333-3333-3333-333333333332', 'Which part of the Constitution deals with Fundamental Rights?', '["Part I", "Part II", "Part III", "Part IV"]', 2, 'Part III of the Constitution (Articles 12-35) deals with Fundamental Rights.', 'easy', 'placeholder', false),
('44444444-4444-4444-4444-444444444442', '33333333-3333-3333-3333-333333333333', 'Who is the ex-officio chairman of the Rajya Sabha?', '["President", "Vice-President", "Prime Minister", "Chief Justice of India"]', 1, 'The Vice-President of India is the ex-officio chairman of the Rajya Sabha.', 'easy', 'placeholder', false)
on conflict (id) do nothing;
