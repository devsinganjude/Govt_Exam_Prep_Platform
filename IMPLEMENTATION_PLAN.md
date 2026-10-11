# IMPLEMENTATION_PLAN.md — Government Exam Prep Web App

> **Instructions to the AI agent:** Read this entire file before writing any code. Work through the phases in order. Complete ONE task at a time, verify it, commit it, then move to the next. Do not skip ahead. Do not add features that are not listed here.

---

## 1. Project Overview

**Working title:** ExamPrep (placeholder, easy to rename)

**Goal:** A personal web application to prepare for Indian government competitive exams. The first target exam is **MPSC Combined (Maharashtra)**. The architecture must treat "exam" as data so that other exams (UPSC, SSC, Banking) can be added later without code changes.

**Primary user:** A single student (the owner), with multi-user support via auth so it can be shared later.

**Core value:**
1. Track syllabus completion topic by topic.
2. Practice MCQs by subject and topic.
3. Take timed mock tests with negative marking.
4. See analytics: weak topics, accuracy, time per question.
5. Follow a daily plan with spaced-repetition revision.

---

## 2. Agent Operating Rules (IMPORTANT)

1. **One task at a time.** After each task: run the app, run lint and typecheck, fix errors, then commit.
2. **Plan before coding.** For every phase, first list the files you will create or modify, then implement.
3. **Never change the database schema** without stating the change and updating `supabase/migrations/`.
4. **TypeScript strict mode.** No `any` unless unavoidable and commented.
5. **Use only the stack in Section 3.** Ask before adding a new dependency.
6. **Security:** Row Level Security (RLS) must be enabled on every table. Never expose the Supabase service role key to the client.
7. **Every page must have** a loading state, an empty state, and an error state.
8. **Mobile first.** Every screen must work at 360px width.
9. **Commit messages:** Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
10. **Keep a progress log** at the bottom of this file. After completing each task, tick its checkbox and add a one-line note.
11. **If a requirement is ambiguous,** choose the simplest option, note the assumption in the progress log, and continue.
12. **Do not fabricate exam content.** Seed questions are placeholders only and must be marked `verified = false`.

---

## 3. Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | lucide-react |
| Charts | Recharts |
| Backend / DB / Auth | Supabase (Postgres, Auth, RLS) via `@supabase/ssr` |
| Forms and validation | react-hook-form + zod |
| CSV import | papaparse |
| State (client) | React state plus TanStack Query only if needed |
| Hosting | Vercel |
| CI | GitHub Actions (lint, typecheck, build) |
| Package manager | pnpm |

---

## 4. Folder Structure

```
/
├── IMPLEMENTATION_PLAN.md
├── CLAUDE.md                      # agent rules (copy of Section 2)
├── .env.example
├── .github/workflows/ci.yml
├── supabase/
│   ├── migrations/
│   │   ├── 0001_init.sql
│   │   └── 0002_rls.sql
│   └── seed.sql
├── src/
│   ├── app/
│   │   ├── (auth)/login/page.tsx
│   │   ├── (auth)/signup/page.tsx
│   │   ├── (app)/layout.tsx       # protected layout with nav
│   │   ├── (app)/dashboard/page.tsx
│   │   ├── (app)/syllabus/page.tsx
│   │   ├── (app)/syllabus/[subjectId]/page.tsx
│   │   ├── (app)/practice/page.tsx
│   │   ├── (app)/tests/page.tsx
│   │   ├── (app)/tests/new/page.tsx
│   │   ├── (app)/tests/[attemptId]/page.tsx        # test taking
│   │   ├── (app)/tests/[attemptId]/result/page.tsx
│   │   ├── (app)/analytics/page.tsx
│   │   ├── (app)/planner/page.tsx
│   │   ├── (app)/bookmarks/page.tsx
│   │   ├── (app)/admin/import/page.tsx             # CSV import
│   │   └── auth/callback/route.ts
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── syllabus/
│   │   ├── practice/
│   │   ├── test/
│   │   ├── analytics/
│   │   └── layout/
│   ├── lib/
│   │   ├── supabase/{client,server,middleware}.ts
│   │   ├── scoring.ts
│   │   ├── spaced-repetition.ts
│   │   ├── analytics.ts
│   │   └── utils.ts
│   ├── types/database.ts          # generated Supabase types
│   └── middleware.ts
```

---

## 5. Environment Variables

`.env.example`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Server-only, never prefix with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 6. Database Schema

### `supabase/migrations/0001_init.sql`

```sql
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
```

### `supabase/migrations/0002_rls.sql`

```sql
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
```

**Note:** Writes to `exams`, `subjects`, `topics`, `questions` are done only through the Supabase dashboard, SQL, or the admin import route using the service role key on the server. Do not create client-side write policies for these tables.

---

## 7. Seed Data (`supabase/seed.sql`)

Seed the following so the app is usable immediately:

- **1 exam:** MPSC Combined Prelims (`total_marks = 100`, `marks_per_question = 2`, `negative_marking = 0.25`). Mark as editable placeholder values.
- **Subjects (General Studies):** History, Geography, Polity, Economy, Science and Technology, Environment, Current Affairs.
- **Subject:** CSAT (aptitude and reasoning).
- **3 to 6 topics per subject** (for example Polity: Constitution Basics, Fundamental Rights, Parliament, Local Self Government).
- **10 placeholder questions** across 2 subjects with `verified = false` and `source = 'placeholder'`.

> The owner will replace the syllabus with the official MPSC syllabus and weightage later via CSV import.

---

## 8. Phased Implementation

### PHASE 0 — Project setup
- [x] **0.1** Initialize Next.js (App Router, TypeScript, Tailwind, ESLint, `src/` dir) with pnpm.
- [x] **0.2** Install and initialize shadcn/ui. Add: button, card, input, label, dialog, tabs, progress, badge, checkbox, select, skeleton, toast, dropdown-menu, sheet.
- [x] **0.3** Create `.env.example`, `CLAUDE.md` (copy of Section 2), and the folder structure from Section 4 (empty placeholder files are fine).
- [x] **0.4** Add Supabase clients (`@supabase/ssr`): browser client, server client, middleware session refresh.
- [x] **0.5** Add GitHub Actions workflow: `pnpm install`, `pnpm lint`, `pnpm tsc --noEmit`, `pnpm build`.

**Acceptance:** `pnpm dev` runs, `pnpm build` passes, CI is green.

### PHASE 1 — Auth and layout
- [x] **1.1** Run migrations 0001 and 0002 on Supabase. Generate types into `src/types/database.ts`.
- [x] **1.2** Build `/login` and `/signup` (email and password) plus Google OAuth. Implement `/auth/callback`.
- [x] **1.3** `middleware.ts`: redirect unauthenticated users from `(app)` routes to `/login`; redirect logged-in users away from auth pages.
- [x] **1.4** App shell: sidebar on desktop, bottom tab bar on mobile. Nav items: Dashboard, Syllabus, Practice, Tests, Analytics, Planner, Bookmarks. Theme toggle (light and dark).
- [x] **1.5** First-login onboarding: choose target exam, daily goal hours, optional exam date. Save to `profiles`.

**Acceptance:** A new user can sign up, complete onboarding, see the shell, and log out. Two different accounts cannot see each other's profile data.

### PHASE 2 — Syllabus tracker
- [x] **2.1** `/syllabus`: list subjects as cards with a progress bar (done topics / total topics).
- [x] **2.2** `/syllabus/[subjectId]`: list topics with a 3-state control (not started, in progress, done). Show the weightage badge if present.
- [x] **2.3** Upserting into `topic_progress` on change, with optimistic UI and rollback on error.
- [x] **2.4** When a topic is marked **done** for the first time, set `revision_stage = 0` and compute `next_revision_at` (see Section 9.2).
- [x] **2.5** Dashboard widgets: overall syllabus completion %, subject-wise bars.

**Acceptance:** Progress persists after refresh. Percentages are correct. Works on a 360px screen.

### PHASE 3 — Practice mode and question bank
- [ ] **3.1** `/practice` filter bar: subject, topic, difficulty, "only bookmarked", "only unverified hidden" toggle (default: show verified and unverified, with a badge on unverified).
- [ ] **3.2** Question card: show the question, 4 options, and on selecting an option immediately reveal correct or wrong plus the explanation. Next and Previous buttons. Show the year and source.
- [ ] **3.3** Bookmark button with optional note (stored in `bookmarks`).
- [ ] **3.4** `/bookmarks`: list saved questions with notes, and a remove action.
- [ ] **3.5** `/admin/import`: CSV upload (papaparse) → preview table → validation (zod) → insert via a server action using the service role key. Restrict to a single owner email set in env var `ADMIN_EMAIL`.
  - CSV columns: `exam,subject,topic,question_text,option_a,option_b,option_c,option_d,correct_option(A-D),explanation,difficulty,year,source,verified`
  - Create subjects and topics if they do not exist.

**Acceptance:** Importing a 50-row CSV works, shows per-row errors for bad rows, and inserted questions appear in practice.

### PHASE 4 — Mock test engine
- [x] **4.1** `/tests/new`: create a test by choosing subjects or topics, number of questions, duration, and difficulty mix. Select questions randomly (server side), insert into `tests` (with `user_id`).
- [x] **4.2** Starting a test creates an `attempts` row and one `attempt_answers` row per question (null selection).
- [x] **4.3** `/tests/[attemptId]`: single-question view, question palette (answered, unanswered, marked for review), countdown timer, Next, Previous, Mark for Review, Clear Response.
- [x] **4.4** **Autosave:** every selection updates `attempt_answers` immediately (debounced no more than 500 ms). Track `time_spent_sec` per question.
- [x] **4.5** **Timer correctness:** compute remaining time from `started_at + duration`, not from a client counter alone, so refresh and reopen resume correctly. Auto-submit at zero.
- [x] **4.6** Submit flow: confirmation dialog showing answered / unanswered / marked counts. On submit, compute `is_correct` per answer and the score using `lib/scoring.ts`, then set `submitted_at`, `time_taken_sec`, `score`, `status = 'submitted'`.
- [x] **4.7** Block re-entry to a submitted attempt (redirect to result).
- [x] **4.8** `/tests/[attemptId]/result`: score, correct, wrong, unattempted, accuracy, time taken, subject-wise breakdown, and a review list where each question shows your answer, the correct answer, and the explanation.
- [x] **4.9** `/tests`: list past attempts with scores.

**Acceptance:** Refreshing mid-test restores answers and the correct remaining time. The score matches the formula in Section 9.1. Auto-submit works.

### PHASE 5 — Analytics
- [ ] **5.1** Score trend line chart (last 10 attempts).
- [ ] **5.2** Subject-wise accuracy bar chart (all submitted attempts plus practice, if tracked).
- [ ] **5.3** Weak-topic list: topics with accuracy below 50% and at least 5 attempted questions, sorted ascending. Each links to practice filtered on that topic.
- [ ] **5.4** Time analysis: average seconds per question versus the target (`duration / question count`).
- [ ] **5.5** Put the logic in `lib/analytics.ts` as pure functions with unit tests.

**Acceptance:** Charts render with real data and with an empty state when no attempts exist.

### PHASE 6 — Planner and revision
- [ ] **6.1** `/planner`: today's plan, which includes (a) topics due for revision (`next_revision_at <= now()`), (b) next three "not started" or "in progress" topics, (c) daily goal hours from the profile.
- [ ] **6.2** "Mark revised" button on due topics, which advances `revision_stage` and recomputes `next_revision_at` (Section 9.2).
- [ ] **6.3** Study streak: count consecutive days with at least one of: topic status change, practice question answered, or test submitted. Add a lightweight `activity_log` table (migration 0003) with `user_id, date, type`, protected by RLS.
- [ ] **6.4** Countdown to the exam date from the profile, if set.

**Acceptance:** Marking a topic revised moves it out of today's list and schedules the next interval.

### PHASE 7 — Polish and deploy
- [ ] **7.1** Accessibility pass: keyboard navigation in the test UI, ARIA labels, focus states, sufficient contrast.
- [ ] **7.2** Performance pass: server components where possible, pagination in practice mode (page size 20), indexes verified.
- [ ] **7.3** SEO and PWA basics: metadata, favicon, manifest so it can be installed on a phone.
- [ ] **7.4** Deploy to Vercel. Set environment variables. Configure the Supabase auth redirect URLs for production and preview.
- [ ] **7.5** Write `README.md`: what it is, screenshots, architecture diagram (mermaid), setup steps, environment variables, CSV format.

**Acceptance:** Production URL works end to end. Lighthouse mobile score of at least 85 for performance and 90 for accessibility.

---

## 9. Business Logic Specs

### 9.1 Scoring (`lib/scoring.ts`)

```
For each answer:
  unattempted (selected_option is null) -> 0
  correct                               -> + marks_per_question
  wrong                                 -> - marks_per_question * negative_marking

score = sum of the above (may be negative)
accuracy = correct / (correct + wrong)   (0 if none attempted)
```

Unit tests required:
- all correct, all wrong, all unattempted, mixed, zero negative marking.

### 9.2 Spaced repetition (`lib/spaced-repetition.ts`)

```
INTERVALS_DAYS = [1, 3, 7, 21, 45]

onFirstDone(): revision_stage = 0; next_revision_at = now + INTERVALS_DAYS[0] days
onRevised():   revision_stage = min(revision_stage + 1, INTERVALS_DAYS.length - 1)
               last_revised_at = now
               next_revision_at = now + INTERVALS_DAYS[revision_stage] days
```

If a topic is moved back from `done` to another status, clear `next_revision_at`.

### 9.3 Question selection for a test
- Filter by the chosen subjects and topics and difficulty.
- Random order, no duplicates, and prefer questions the user has not seen in previous attempts. If there are not enough unseen questions, fill with seen ones.
- If the pool is smaller than the requested count, show a clear error with the available count.

---

## 10. UI / UX Guidelines

- Clean, distraction-free, exam-focused. Neutral palette with one accent colour.
- Test screen: no sidebar, large readable question text, and a sticky timer at the top.
- Use the Marathi-capable font **Noto Sans Devanagari** alongside the Latin font, so Marathi questions render correctly.
- Add a `language` field on the exam now; the full bilingual question toggle is a future item (Section 12).
- Use skeleton loaders, not spinners, for list pages.
- Confirmation dialogs for destructive actions (submit test, remove bookmark with note).

---

## 11. Testing Checklist

**Automated**
- [ ] Unit tests (Vitest) for `scoring.ts`, `spaced-repetition.ts`, `analytics.ts`.
- [ ] CI runs lint, typecheck, tests, and build.

**Manual before each release**
- [ ] Create two accounts. Confirm neither can read the other's `topic_progress`, `attempts`, `attempt_answers`, or `bookmarks` (RLS check).
- [ ] Refresh mid-test and confirm answers and timer are restored.
- [ ] Let the timer reach zero and confirm auto-submit.
- [ ] Import a CSV with a few bad rows and confirm the errors are shown.
- [ ] Use the app on a 360px viewport and confirm there is no horizontal scroll.
- [ ] Try direct URLs to another user's attempt id and confirm access is denied.

---

## 12. Out of Scope for MVP (Do Not Build Yet)

- AI tutor or explanation generation (planned later with the Claude API)
- Payments or subscriptions
- Leaderboards and social features
- Video lectures
- Native mobile app
- Full Marathi and English per-question toggle
- Current affairs auto-fetching

Keep a `BACKLOG.md` file for ideas that come up during development instead of building them.

---

## 13. Definition of Done (MVP)

- [ ] All Phase 0 to 7 checkboxes ticked
- [ ] RLS verified with two accounts
- [ ] Deployed on Vercel with a working production login
- [ ] README written
- [ ] At least 100 real questions imported and spot-checked by the owner
- [ ] The owner has used the app daily for 3 days with no blocking bugs

---

## 14. Progress Log

> The agent appends a line here after each completed task: `YYYY-MM-DD | task id | note / assumption`

- _(empty)_
2026-10-10 | Phase 0 | Completed project setup, shadcn, and supabase clients.
2026-10-10 | Phase 1 | Completed auth, layouts, and onboarding.
2026-10-11 | Phase 2 | Completed dashboard and syllabus views.
2026-10-11 | Phase 3 | Completed practice mode and question fetching.
