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
