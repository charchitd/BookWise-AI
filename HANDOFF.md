# BookWise AI — Session Handoff
**Date:** 2026-05-13  
**Session focus:** Gamified AI learning platform built on top of uploaded PDFs

---

## What BookWise AI Is

A Next.js 16 + Supabase app that takes any uploaded PDF and turns it into a structured AI-powered course. Users study sessions, chat with an AI tutor, take quizzes, listen to audio summaries, earn XP and streaks, rank on a global leaderboard, and receive shareable certificates when they complete a course.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database + Auth | Supabase (Postgres + RLS + Storage) |
| Styling | Tailwind CSS + shadcn/ui tokens |
| AI inference | OpenRouter (`google/gemini-flash-1.5` for ingestion/quiz, `claude` via OpenRouter for tutor chat) |
| PDF parsing | `pdf-parse` v2 (class-based API) |
| Audio | Web Speech API (browser-native, no API key) |
| Deployment | Vercel-ready |

---

## Database Schema (all migrations applied)

### `001` — Initial schema
- `books` — id, user_id, title, author, status (processing/ready/failed), total_pages, created_at
- `chapters` — id, book_id, num, title, summary, difficulty, page_start, page_end, content
- `concepts` — id, chapter_id, book_id, name, mastery_state (new/learning/mastered)

### `002` — Legal consents (unused, stripped from signup)

### `003` — Storage policies (Supabase Storage bucket `books`)

### `004` — Gamification schema (base)
- `profiles` — id (→ auth.users), display_name, total_learning_minutes, created_at
- RLS: select for all, insert/update for own row
- `increment_learning_minutes(user_uuid, minutes_to_add)` — original void RPC

### `005` — Gamification enhancements ⚠️ **Must be applied**
Adds to `profiles`:
- `daily_goal_minutes` int DEFAULT 60
- `xp_points` int DEFAULT 0
- `current_streak_days` int DEFAULT 0
- `last_active_date` date
- `onboarding_completed` boolean DEFAULT false

New/replaced functions:
- `get_user_level(xp int) → int` — 10-tier level (100/300/600/1000/1600/2500/4000/6000/9000 XP thresholds)
- `increment_learning_minutes(user_uuid, minutes_to_add) → jsonb` — now returns `{ xp_earned, streak, total_xp }` and handles streak logic

### `006` — Certificates ⚠️ **Must be applied**
- `certificates` — id, user_id, book_id, book_title, display_name, top_concepts text[], issued_at
- UNIQUE(user_id, book_id) — one cert per book per user
- RLS: select own, insert via service role

### `007` — Quiz hints column ⚠️ **Must be applied**
```sql
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS quiz_hints text[] DEFAULT '{}';
```

---

## Pending SQL (run in Supabase SQL Editor in order)

### Migration 005
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS daily_goal_minutes int NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS xp_points int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS current_streak_days int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_active_date date,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION get_user_level(xp int) RETURNS int AS $$
BEGIN
  IF xp < 100 THEN RETURN 1; ELSIF xp < 300 THEN RETURN 2;
  ELSIF xp < 600 THEN RETURN 3; ELSIF xp < 1000 THEN RETURN 4;
  ELSIF xp < 1600 THEN RETURN 5; ELSIF xp < 2500 THEN RETURN 6;
  ELSIF xp < 4000 THEN RETURN 7; ELSIF xp < 6000 THEN RETURN 8;
  ELSIF xp < 9000 THEN RETURN 9; ELSE RETURN 10; END IF;
END; $$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION increment_learning_minutes(user_uuid uuid, minutes_to_add int)
RETURNS jsonb AS $$
DECLARE
  p record; today_date date := CURRENT_DATE;
  xp_earned int := minutes_to_add * 2; new_streak int;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE id = user_uuid;
  IF NOT FOUND THEN
    INSERT INTO public.profiles (id, display_name, total_learning_minutes, xp_points, current_streak_days, last_active_date)
    VALUES (user_uuid, 'Scholar_' || substr(user_uuid::text, 1, 6), minutes_to_add, xp_earned, 1, today_date);
    RETURN jsonb_build_object('xp_earned', xp_earned, 'streak', 1, 'total_xp', xp_earned);
  END IF;
  IF p.last_active_date IS NULL OR p.last_active_date < today_date - 1 THEN new_streak := 1;
  ELSIF p.last_active_date = today_date - 1 THEN new_streak := p.current_streak_days + 1;
  ELSE new_streak := p.current_streak_days; END IF;
  UPDATE public.profiles SET
    total_learning_minutes = total_learning_minutes + minutes_to_add,
    xp_points = xp_points + xp_earned, current_streak_days = new_streak, last_active_date = today_date
  WHERE id = user_uuid;
  RETURN jsonb_build_object('xp_earned', xp_earned, 'streak', new_streak, 'total_xp', p.xp_points + xp_earned);
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Migration 006
```sql
CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  book_id uuid REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  book_title text NOT NULL, display_name text NOT NULL,
  top_concepts text[] DEFAULT '{}', issued_at timestamptz DEFAULT now(),
  UNIQUE(user_id, book_id)
);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "service role can insert certificates" ON public.certificates FOR INSERT WITH CHECK (true);
```

### Migration 007
```sql
ALTER TABLE public.chapters ADD COLUMN IF NOT EXISTS quiz_hints text[] DEFAULT '{}';
```

---

## Full Feature Map

### Onboarding (`/onboarding`)
- **File:** `src/app/onboarding/page.tsx`
- Standalone page (no sidebar), shown on first login
- Step 1: display name input
- Step 2: daily hours commitment selector (30min / 1hr / 1.5hr / 2hr / 3hr+) with visual cards showing persona title (Casual Learner → Grand Master)
- Step 3: celebration screen → auto-redirects to dashboard
- **API:** `POST /api/profile/setup` — saves display_name + daily_goal_minutes, sets onboarding_completed = true
- **Guard:** `(app)/layout.tsx` fetches profile on every route change; if `onboarding_completed = false` → redirects to `/onboarding`

### PDF Ingestion Pipeline (`src/lib/ingest.ts`)
The pipeline was completely rebuilt this session. Previous version used regex chapter detection (only worked for books that literally said "Chapter X") — always fell back to 1 giant session.

**New pipeline:**
1. Download PDF from Supabase Storage (`books` bucket, path: `{userId}/{bookId}.pdf`)
2. Extract text via `pdf-parse` with custom page renderer → embeds `[PAGE_N]` markers
3. Strip null bytes / control chars that break Postgres: `replace(/[\x00-\x08...]/g, '')`
4. `segmentByDailyGoal(text, dailyGoalMinutes)` — splits by `[PAGE_N]` markers into sessions of `max(8, min(35, floor(dailyGoal/2 / 2)))` pages each
5. For each session: call `google/gemini-flash-1.5` via OpenRouter with `buildIngestionPrompt()` → returns `{ title, summary, concepts[], difficulty, quiz_hints[] }`
6. Insert chapter + concepts into DB; delete stale chapters from prior failed attempts first
7. Mark book `status = ready`

**Session sizing by daily goal:**
- 30 min/day → ~8 pages/session (~15 min each)
- 60 min/day → ~15 pages/session (~25 min each)
- 120 min/day → ~25 pages/session (~45 min each)
- Always capped: min 8 pages, max 35 pages

**Key file:** `src/lib/pdf.ts` — `segmentByDailyGoal()` replaces old `segmentChapters()`

### Course Dashboard (`/books/[id]/course`)
- **File:** `src/app/(app)/books/[id]/course/page.tsx`
- Server component — awaits `params` (Next.js 16 requirement, was a bug)
- Stats row: progress %, ETA in days, daily goal, streak + XP
- Overall progress bar with gradient
- Session cards: completion status, estimated time, concept tags
- Shows "Certified ✓" banner if certificate already issued for this book
- ETA calculation: `ceil(remaining_minutes / daily_goal_minutes)` days

### Session Viewer (`/books/[id]/session/[sessionId]`)
- **Files:** `src/app/(app)/books/[id]/session/[sessionId]/page.tsx`, `src/components/session-viewer.tsx`
- Split layout: left panel + right AI chat
- **Left panel has 3 tabs:**

  **Study Notes tab:**
  - Focus timer (15/25/45/60 min Pomodoro with circular progress ring)
  - Auto-syncs XP every 60 seconds of active timer
  - Session summary + key concepts with mastery badges
  - Prev/Next session navigation
  - Mark as Done button

  **Audio tab:**
  - `src/components/audio-player.tsx` — uses `window.speechSynthesis` (Web Speech API, no API key)
  - Reads: session title + summary + concept names aloud
  - Controls: Play/Pause, Stop, Restart, Speed (0.75x/1x/1.25x/1.5x/2x), Voice selector (filters English voices)
  - Scrollable transcript with word-by-word highlighting as audio plays
  - Progress bar showing % complete

  **Quiz tab:**
  - Auto-loads on tab click via `POST /api/quiz/generate` with `bookId + chapterId`
  - Uses `google/gemini-flash-1.5` to generate 5 MCQ questions from session concepts
  - Shows question → 4 options → correct/wrong highlight → explanation → next
  - Score summary at end (Excellent ≥80% / Good ≥50% / Review <50%)
  - Retake button

- **Right panel:** Streaming AI tutor chat
  - Context-injected with current session title
  - Quick prompt chips when chat is empty
  - Streams via `POST /api/tutor/chat`

- **XP Toast:** slides in from top-right when timer syncs (+N XP, streak badge)
- **Certificate Modal:** shown when marking the final session done → links to /certificates

### Library / Dashboard (`/dashboard`)
- **File:** `src/app/(app)/dashboard/page.tsx`
- Shows all user's books with inline progress bars
- Fetches concepts + certificates in batch after book list loads
- Per-book CTA: "Start Course" / "Continue X%" / "Review" (when complete)
- Gold badge + "Certified ✓" label on completed books
- PDF upload via `UploadDropzone` → triggers ingest with user's daily_goal

### Leaderboard (`/leaderboard`)
- **File:** `src/app/(app)/leaderboard/page.tsx`
- Ranks by XP (not raw hours)
- Top 3 podium with gold/silver/bronze styling
- Full table: rank, avatar, display name, level badge, streak flame, XP
- 10-level system: Spark → Apprentice → Scholar → Analyst → Sage → Expert → Master → Virtuoso → Grand Master → Legend
- Level badge colors: gray (1-2) → blue (3-4) → purple (5-6) → orange (7-8) → gold (9-10)
- "How XP Works" explainer at bottom

### Certificates (`/certificates`)
- **Files:** `src/app/(app)/certificates/page.tsx`, `src/components/certificate-card.tsx`
- Auto-issued when all concepts in all sessions of a book are mastered
- Awards +200 XP bonus on issue
- Each card: book title, recipient name, mastered concepts, issue date
- 5 rotating color themes (gold, purple, emerald, rose, cyan)
- **Share buttons on every certificate:**
  - **LinkedIn** — opens LinkedIn share article with pre-filled title + summary
  - **Reddit** — opens Reddit submit with pre-filled title + body
  - **GitHub** — copies markdown badge to clipboard (shield.io badge + README snippet)
  - GitHub button shows "Copied!" confirmation for 2s

### Sidebar Layout (`(app)/layout.tsx`)
- Nav: Library, AI Tutor, Quiz, Leaderboard, Certificates
- Bottom stats widget (visible after onboarding):
  - 🔥 N-day streak
  - ⚡ N XP
  - Level bar with name (Lv.3 Scholar) and % progress to next level
- Onboarding guard: redirects to `/onboarding` if `onboarding_completed = false`

---

## API Routes

| Method | Route | Purpose |
|---|---|---|
| POST | `/api/books/upload` | Upload PDF to Supabase Storage |
| POST | `/api/books/ingest` | Run AI ingestion pipeline (fetches daily_goal from profile) |
| POST | `/api/books/retry` | Retry failed ingestion |
| DELETE | `/api/books` | Delete book + cascades |
| POST | `/api/tutor/chat` | Streaming AI tutor (OpenRouter) |
| POST | `/api/quiz/generate` | Generate MCQ quiz for book/chapter |
| POST | `/api/quiz/answer` | Update concept mastery state |
| POST | `/api/stats/sync-time` | Increment learning minutes + XP + streak (returns `{ xp_earned, streak, total_xp }`) |
| POST | `/api/courses/complete-session` | Mark all chapter concepts as mastered; auto-issues certificate if course complete |
| POST | `/api/certificates/check` | Manual certificate check endpoint |
| POST | `/api/profile/setup` | Save onboarding data (display_name, daily_goal_minutes) |

---

## Known Issues / Next Steps

### Must do after this session
1. **Apply migrations 005, 006, 007** in Supabase SQL Editor (SQL provided above)
2. **Delete and re-upload any existing books** — old ingestion created 1 broken "Full Text" session; new pipeline will correctly segment into multiple sessions

### Known edge cases
- Very short PDFs (<8 pages) produce 1 session — this is correct behavior
- PDFs with no extractable text (scanned images) will produce empty sessions — no OCR support yet
- `quiz_hints` column is stored but not yet surfaced in the quiz UI (quiz still generates from scratch via AI)
- Web Speech API is unavailable in some browsers (Firefox has limited support) — audio tab shows a fallback message

### Potential next features
- **OCR support** for scanned PDFs (Tesseract.js or Google Vision)
- **Progress notifications** — email/push when streak is at risk
- **Social profiles** — public certificate pages with shareable URLs
- **Course collaboration** — shared study groups for the same book
- **Spaced repetition** — resurface concepts marked "learning" on a schedule
- **Mobile app** — React Native with the same Supabase backend

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
```

Set in `.env.local`. No other providers needed — OpenRouter proxies both Gemini and Claude.

---

## Running Locally

```bash
npm install
npm run dev
# → http://localhost:3000
```

First visit redirects to `/login`. After signup + email confirm → `/onboarding` → `/dashboard`.
