create extension if not exists "pgcrypto";

create table exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  language text not null default 'en',
  total_marks int not null,
  marks_per_question numeric not null default 1,
  negative_marking numeric not null default 0.25,  -- fraction of marks_per_question deducted per wrong answer
  created_at timestamptz not null default now()
);

create table subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references exams(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  name text not null,
  weightage numeric,            -- optional, approx % of exam
  sort_order int not null default 0
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  question_text text not null,
  options jsonb not null,        -- ["Option A","Option B","Option C","Option D"]
  correct_option int not null check (correct_option between 0 and 3),
  explanation text,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  year int,
  source text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);
create index on questions(topic_id);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  target_exam_id uuid references exams(id),
  daily_goal_hours numeric not null default 4,
  exam_date date,
  created_at timestamptz not null default now()
);

create table topic_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','done')),
  revision_stage int not null default 0,   -- index into the spaced repetition intervals
  last_revised_at timestamptz,
  next_revision_at timestamptz,
  unique (user_id, topic_id)
);

create table tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,  -- null = global test
  exam_id uuid not null references exams(id),
  title text not null,
  duration_min int not null,
  question_ids uuid[] not null,
  created_at timestamptz not null default now()
);

create table attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  test_id uuid not null references tests(id) on delete cascade,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  score numeric,
  time_taken_sec int,
  status text not null default 'in_progress' check (status in ('in_progress','submitted'))
);

create table attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references attempts(id) on delete cascade,
  question_id uuid not null references questions(id),
  selected_option int check (selected_option between 0 and 3),  -- null = unattempted
  marked_for_review boolean not null default false,
  time_spent_sec int not null default 0,
  is_correct boolean,
  unique (attempt_id, question_id)
);

create table bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  question_id uuid not null references questions(id) on delete cascade,
  note_text text,
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

-- Auto-create a profile on signup
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)));
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();
