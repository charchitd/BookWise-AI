# BookWise AI — Design System & UI/UX Transformation Guide

> **Role:** Senior UI/UX Designer  
> **Brief:** Transform BookWise AI into a best-in-class, modern web learning platform that feels as polished as Notion, as engaging as Duolingo, and as intelligent as Perplexity.

---

## 1. Design Vision & Philosophy

### Core Principle: "Knowledge Made Beautiful"

BookWise AI is not just a tool — it's a *learning companion*. The design must reflect three pillars:

| Pillar | Meaning | How it shows |
|--------|---------|--------------|
| **Clarity** | Never let UI compete with content | Generous whitespace, clean hierarchy |
| **Delight** | Learning should feel rewarding | Micro-animations, progress feedback, celebrations |
| **Intelligence** | AI-first, not AI-bolted-on | Contextual AI surfaces naturally in the flow |

### Design Persona
The app should feel like **a warm, intelligent library** — not a cold SaaS dashboard. Think dark walnut shelves, warm amber reading lamps, the feeling of a productive evening with a great book.

---

## 2. Brand Identity

### Logo & Wordmark
- Icon: An open book with a subtle spark/neural-network motif inside the pages
- Wordmark: `BookWise` in a modern serif (Playfair Display or DM Serif), `AI` in a lighter geometric sans
- Logo mark should work as a 32×32 favicon and a full lockup

### Brand Voice
- Smart but not academic
- Encouraging, not pushy
- Concise — every UI label is a conversation

---

## 3. Color System

### Philosophy: Dark-first, Light-capable

The primary experience should be a **rich dark mode** (most reading/studying happens in low light). Light mode is a first-class citizen but secondary.

```css
/* ── DARK THEME (Primary) ── */
--bg-base:         #0D0F14;   /* Near-black, slightly warm */
--bg-surface:      #13161E;   /* Cards, panels */
--bg-elevated:     #1C2030;   /* Modals, dropdowns */
--bg-overlay:      #252A3A;   /* Hover states, selections */

--border-subtle:   #2A2F42;
--border-default:  #343A52;
--border-strong:   #4A5170;

/* ── ACCENT — Amber/Gold (Knowledge, warmth) ── */
--accent-primary:  #F5A623;   /* Main CTA, highlights */
--accent-hover:    #FFB84D;
--accent-muted:    #3D2E10;   /* Background tint */
--accent-text:     #FFC84E;

/* ── SECONDARY — Indigo/Violet (AI, intelligence) ── */
--ai-primary:      #7C6FE0;   /* AI responses, tutor */
--ai-hover:        #9485F0;
--ai-muted:        #2A2545;
--ai-text:         #A99EF5;

/* ── SEMANTIC ── */
--success:         #34D399;   /* Mastered, complete */
--warning:         #FBBF24;   /* In progress */
--error:           #F87171;   /* Failed, errors */
--info:            #60A5FA;   /* Tips, info */

/* ── TEXT ── */
--text-primary:    #F0F2F8;
--text-secondary:  #9BA3BE;
--text-tertiary:   #5C6480;
--text-inverse:    #0D0F14;

/* ── LIGHT THEME (Secondary) ── */
--bg-base-light:      #FAFAF8;  /* Warm white */
--bg-surface-light:   #FFFFFF;
--bg-elevated-light:  #F4F3EF;
--accent-primary-light: #D4860A;
```

### Gamification Color Layers
- 🥇 Gold mastery: `#F5A623`
- 🥈 Silver progress: `#9BA3BE`
- 🥉 Bronze started: `#C87941`
- 🔥 Streak: `#FF6B35`
- ⚡ XP / Points: `#7C6FE0`

---

## 4. Typography

### Type Scale

```
Font Stack:
  Display:   "Playfair Display", Georgia, serif          → Page titles, hero headings
  Heading:   "Inter", system-ui, sans-serif               → Section headings, nav
  Body:      "Inter", system-ui, sans-serif               → UI text
  Reading:   "Lora", Georgia, serif                       → Book content, AI responses
  Mono:      "JetBrains Mono", "Fira Code", monospace     → Code, metadata
```

### Scale (Tailwind-compatible)

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-display` | 48–64px | 700 | Hero titles only |
| `text-h1` | 32px | 700 | Page titles |
| `text-h2` | 24px | 600 | Section headers |
| `text-h3` | 18px | 600 | Card titles, subsections |
| `text-body-lg` | 16px | 400 | Primary reading text |
| `text-body` | 14px | 400 | Default UI text |
| `text-small` | 12px | 400 | Labels, captions |
| `text-xs` | 11px | 500 | Badges, tags |

### Reading Mode Typography
When users are in the Session Viewer or reading AI responses, switch to **reading typography**:
- Font: Lora 17px
- Line height: 1.8
- Max width: 65ch
- Letter spacing: 0.01em
- Paragraph spacing: 1.2em

---

## 5. Layout System

### Grid
- **Base unit:** 4px
- **Spacing scale:** 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128px
- **Content max-width:** 1280px
- **Reading max-width:** 720px

### App Shell Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px collapsed: 64px)         TOP BAR (56px)     │
│  ┌──────┐  ┌─────────────────────────────────────────────┐  │
│  │ Nav  │  │  Breadcrumb + Search + User + AI Quick Bar  │  │
│  │      │  ├─────────────────────────────────────────────┤  │
│  │ Book │  │                                             │  │
│  │ List │  │              PAGE CONTENT                   │  │
│  │      │  │                                             │  │
│  │      │  │                                             │  │
│  │      │  │                                             │  │
│  │Status│  │                                             │  │
│  │ Bar  │  │                                             │  │
│  └──────┘  └─────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Sidebar Design
- **Width:** 240px expanded / 64px icon-only (auto-collapse on < 1024px)
- **Logo area:** 56px tall, always visible
- **Nav items:** Icon + Label, active state has amber left border + bg tint
- **Book list section:** Scrollable, each book as mini-card with status dot
- **Bottom:** User avatar, streak counter, settings icon

### Responsive Breakpoints
| Name | Width | Layout |
|------|-------|--------|
| Mobile | < 640px | Bottom tab nav, full-screen pages |
| Tablet | 640–1024px | Collapsible sidebar overlay |
| Desktop | 1024–1280px | Icon sidebar (64px) |
| Wide | > 1280px | Full sidebar (240px) |

---

## 6. Component Design Specifications

### 6.1 Book Card (Dashboard)

```
┌─────────────────────────────────────────┐
│ ┌──────────┐                            │
│ │  Cover   │  Book Title                │
│ │ (60×80)  │  Author · Pages            │
│ │          │                            │
│ │          │  ████████░░░░  67% mastered│
│ └──────────┘                            │
│ [📖 Continue]  [🎯 Quiz]  [⋯]          │
└─────────────────────────────────────────┘
```

- Background: `--bg-surface`
- Border: `--border-subtle`, radius `12px`
- Hover: lift shadow + border becomes `--border-default`
- Progress bar: gradient amber `#F5A623` → `#FFB84D`
- Cover: generated book art using first-letter + color hash, or actual cover

### 6.2 AI Tutor Chat Interface

```
┌─────────────────────────────────────────────────────┐
│ ┌─ BookWise Tutor ──────────────────── [Minimize] ─┐│
│ │ 🔮 Based on Chapter 3 of "Atomic Habits"         ││
│ ├──────────────────────────────────────────────────┤│
│ │                                                  ││
│ │   [AI message bubble — indigo bg, Lora font]     ││
│ │                                                  ││
│ │         [User message — right-aligned, amber]    ││
│ │                                                  ││
│ │   [AI is typing... ● ● ●]                        ││
│ │                                                  ││
│ ├──────────────────────────────────────────────────┤│
│ │  [Ask anything about this book...]  [Send ➤]    ││
│ │  [Explain] [Quiz me] [Summarize] [Key Points]   ││
│ └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

- AI bubble: `--ai-muted` background, `--ai-text` color, Lora font
- Context pills: Show which chapter/concept is active
- Quick action chips: Pill buttons below input
- Streaming text: Word-by-word reveal with cursor blink

### 6.3 Quiz Component

**Question Card:**
```
┌─────────────────────────────────────────────────────┐
│  Question 3 of 10          ████████░░  [⏱ 0:45]    │
│                                                     │
│  "What is the main concept behind habit stacking?"  │
│                                                     │
│  ○  A. Replacing old habits with new ones           │
│  ○  B. Linking a new habit to an existing one  ←   │
│  ○  C. Breaking habits into smaller chunks          │
│  ○  D. Tracking habits in a journal                 │
│                                                     │
│  [Hint 💡]                        [Submit Answer]   │
└─────────────────────────────────────────────────────┘
```

- Correct answer: Green border + checkmark animation (✓ bounce)
- Wrong answer: Red border + shake animation + correct shown
- Progress: Segmented bar at top (colored dots per question)
- Timer: Amber countdown, turns red under 10s

### 6.4 Leaderboard

```
┌─────────────────────────────────────────────────────┐
│  🏆 This Week's Scholars                            │
│                                                     │
│  #  User              XP      Books   Streak        │
│  ─────────────────────────────────────────          │
│  🥇 Charchit D.      2,480    12      🔥 14 days   │
│  🥈 Sarah K.         2,100     9      🔥  9 days   │
│  🥉 Marcus T.        1,890    11      🔥  5 days   │
│     ...                                             │
│  ── You are here ──                                 │
│  #7 You              1,200     6      🔥  3 days   │
└─────────────────────────────────────────────────────┘
```

- Top 3 have special card styling: gold/silver/bronze gradient borders
- User's own row is highlighted with `--accent-muted` background
- Animated rank changes on load

### 6.5 Certificate Card

```
┌════════════════════════════════════════════════════════╗
║  ✦  BookWise AI  ✦                                    ║
║                                                        ║
║       Certificate of Mastery                          ║
║                                                        ║
║   This certifies that  Charchit Dhawan                ║
║   has mastered                                         ║
║   "Atomic Habits" by James Clear                       ║
║                                                        ║
║   Score: 94% · 47 concepts · 12 quiz sessions          ║
║   Issued: May 13, 2026                                 ║
║                                                        ║
║  [Download PDF]  [Share to LinkedIn]  [Tweet]          ║
╚════════════════════════════════════════════════════════╝
```

- Gold foil border effect using CSS gradient animation
- Subtle watermark pattern (BookWise logo repeated, opacity 3%)
- Download triggers a beautiful PDF version

---

## 7. Page-by-Page Redesign

### 7.1 Landing / Marketing Page (Unauthenticated)

**Hero Section:**
- Full-viewport, dark background
- Floating 3D book covers (CSS transforms, subtle parallax)
- Headline: `"Read Less. Know More."` (Playfair Display, 64px)
- Subheadline: `"Upload any book. Let AI turn it into a personalised learning journey."`
- CTA: `[Start for Free →]` (amber, large) + `[See How It Works]` (ghost)
- Animated demo: looping GIF/video of the quiz interface

**Feature Strip:**
- 4 icons in a row: Upload PDF → AI Processes → Study Smart → Earn Certificates

**Social Proof:**
- Testimonial cards, book count processed, user count

### 7.2 Dashboard (Core Screen)

**Layout:** Two-column on desktop (book grid + activity sidebar)

**Left (main):**
- Greeting: `"Good evening, Charchit 👋"` with streak badge
- `[+ Upload New Book]` — primary CTA, prominent
- Recently read (horizontal scroll, 4 cards)
- All books (grid, 3 cols, filterable)

**Right sidebar (280px):**
- Daily streak widget
- XP progress to next level
- Recent quiz scores (mini chart)
- Upcoming: next quiz reminder
- Quick stats: books, concepts mastered, quiz avg

**Empty State (no books):**
- Illustration: a floating glowing book
- Message: `"Your library is empty. Add your first book to begin."`
- `[Upload a Book]` CTA

### 7.3 Book Detail / Study Hub

**URL:** `/books/[id]`

**Layout:** Header + tabbed content

**Header:**
- Large book cover (left)
- Book title, author, pages
- Progress ring (percentage mastered)
- Status badge
- Actions: `[Study Now]` `[Take Quiz]` `[Listen 🎧]` `[Ask Tutor]`

**Tabs:**
1. **Overview** — AI-generated summary, key themes, table of contents
2. **Concepts** — All concepts with mastery state, spaced repetition schedule
3. **Quizzes** — Quiz history, scores, areas to improve
4. **Notes** — User notes with AI-generated highlights
5. **Curriculum** — Learning path, structured lessons

### 7.4 Quiz Page

**Pre-Quiz Screen:**
- Book cover + title
- Settings: Number of questions, difficulty, topic filter
- Previous scores shown
- `[Start Quiz]` button

**In-Quiz:**
- Full-screen focus mode (sidebar hidden)
- Question + options
- Progress indicator
- Optional timer
- Hint system (costs 1 "hint token")

**Results Screen:**
- Score circle (big, animated count-up)
- `🎉 Great job!` or `📚 Keep practicing!` message
- Breakdown: correct / wrong / skipped
- Concept links for wrong answers
- CTA: `[Review Mistakes]` `[Try Again]` `[Back to Book]`
- If 90%+: Certificate unlock animation

### 7.5 Audio Player

**Bottom-bar persistent player** (like Spotify):
```
┌────────────────────────────────────────────────────────────┐
│ 📖 Atomic Habits — Ch. 3    [◀◀] [▶] [▶▶]   0:47 / 4:23 │
│ ████████████░░░░░░░░░░░░░░░    Speed: 1.5x    [↑ Expand]  │
└────────────────────────────────────────────────────────────┘
```

**Expanded view:**
- Full chapter text synced with audio (karaoke-style highlight)
- Chapter navigation
- Speed control (0.5x – 3x)
- Bookmark moments

---

## 8. Motion & Interaction Design

### Principles
1. **Purposeful** — Every animation has a reason (feedback, direction, celebration)
2. **Snappy** — Duration ≤ 300ms for UI transitions, ≤ 600ms for celebrations
3. **Respectful** — Honor `prefers-reduced-motion`

### Key Animations

| Interaction | Animation | Duration |
|-------------|-----------|----------|
| Page enter | Fade + 8px slide up | 200ms |
| Card hover | Scale 1.01 + shadow | 150ms |
| Correct answer | Green flash + checkmark bounce | 400ms |
| Wrong answer | Shake (3 cycles) | 300ms |
| Quiz complete | Confetti burst | 1200ms |
| XP gain | Number count-up + glow | 600ms |
| Streak milestone | Fire emoji pulse + banner | 800ms |
| AI typing | Dot bounce (●●●) | continuous |
| Progress bar fill | Smooth ease-out | 500ms |
| Sidebar collapse | Slide + icon fade-in | 200ms |
| Certificate unlock | Scale from 0 + golden shimmer | 800ms |

### Micro-interactions
- Buttons: Slight scale-down on press (0.97)
- Toggle: Spring animation on state change
- Upload dropzone: Border color pulse when dragging
- Leaderboard rows: Staggered reveal on load

---

## 9. Onboarding Flow

### 3-Step Onboarding (new users)

**Step 1: Welcome**
- `"What do you want to learn?"` — topic interest picker
- Genres: Tech, Business, Psychology, Science, History, Self-Help, etc.

**Step 2: Upload First Book**
- Guided upload with animation
- `"We'll handle the rest — usually takes about 2 minutes"`
- Progress screen with fun facts while processing

**Step 3: Start Studying**
- Auto-start a short quiz on first book
- Earn first XP badge: `🌱 First Page`

---

## 10. Empty States & Error States

### Empty States
Every empty state should have:
1. A relevant illustration (SVG, 160px)
2. A friendly headline
3. A brief description
4. A primary action button

| Page | Illustration | Message |
|------|-------------|---------|
| Dashboard (no books) | Floating book with sparkles | `"Your library awaits"` |
| Notes (empty) | Pencil + blank paper | `"No notes yet — start highlighting"` |
| Leaderboard (no rank) | Trophy outline | `"Play your first quiz to join the board"` |
| Quiz history (none) | Empty scoreboard | `"No quizzes taken yet"` |

### Error States
- Network error: Warm, non-technical message + retry button
- Processing failed: Explain and offer re-upload
- No results: Suggest alternative queries

---

## 11. Accessibility (A11Y)

- **WCAG AA** compliance minimum; target AAA for text contrast
- All interactive elements keyboard-navigable
- Focus rings: 2px amber outline, visible and distinct
- Screen reader: ARIA labels on all icons, live regions for AI responses
- Color: Never rely on color alone (always paired with icon/text)
- Font minimum: 12px (never smaller)
- Touch targets: 44×44px minimum

---

## 12. Design Tokens (Tailwind Config Additions)

```js
// tailwind.config.ts additions
theme: {
  extend: {
    colors: {
      bg: {
        base: '#0D0F14',
        surface: '#13161E',
        elevated: '#1C2030',
        overlay: '#252A3A',
      },
      accent: {
        DEFAULT: '#F5A623',
        hover: '#FFB84D',
        muted: '#3D2E10',
      },
      ai: {
        DEFAULT: '#7C6FE0',
        hover: '#9485F0',
        muted: '#2A2545',
      },
    },
    fontFamily: {
      display: ['Playfair Display', 'Georgia', 'serif'],
      reading: ['Lora', 'Georgia', 'serif'],
      sans: ['Inter', 'system-ui', 'sans-serif'],
    },
    borderRadius: {
      card: '12px',
      modal: '16px',
      pill: '9999px',
    },
    boxShadow: {
      card: '0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.2)',
      'card-hover': '0 4px 16px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3)',
      'glow-accent': '0 0 20px rgba(245,166,35,0.3)',
      'glow-ai': '0 0 20px rgba(124,111,224,0.3)',
    },
    animation: {
      'fade-up': 'fadeUp 200ms ease-out',
      'count-up': 'countUp 600ms ease-out',
      shimmer: 'shimmer 2s linear infinite',
    },
  },
}
```

---

## 13. Recommended Component Library Strategy

Since the project already uses **shadcn/ui**, extend it rather than replace it:

| Need | Recommendation |
|------|---------------|
| Charts (quiz scores, XP) | `recharts` — already harmonious with shadcn |
| Animations | `framer-motion` — for page transitions and celebrations |
| Confetti | `canvas-confetti` — lightweight, zero deps |
| Markdown rendering | `react-markdown` + `rehype-highlight` — already installed |
| Date formatting | `date-fns` — for streak/leaderboard dates |
| Drag & drop | `@dnd-kit/core` — if curriculum reordering is needed |

---

## 14. Implementation Priority

### Phase 1 — Foundation (Week 1–2)
- [ ] Apply color tokens and dark theme globally
- [ ] Implement new sidebar navigation
- [ ] Redesign book card component
- [ ] Update typography system

### Phase 2 — Core Screens (Week 3–4)
- [ ] Dashboard complete redesign
- [ ] Book detail / Study Hub
- [ ] Quiz flow redesign (pre, during, results)
- [ ] AI Tutor chat redesign

### Phase 3 — Delight Layer (Week 5–6)
- [ ] Animations and micro-interactions
- [ ] Certificate redesign + PDF export
- [ ] Leaderboard polish
- [ ] Onboarding flow
- [ ] Empty states

### Phase 4 — Polish (Week 7–8)
- [ ] Mobile responsive refinement
- [ ] Accessibility audit and fixes
- [ ] Performance: lazy loading, skeleton screens
- [ ] Dark ↔ Light mode toggle
- [ ] Marketing landing page

---

## 15. Inspiration & Reference

| Inspiration | What to borrow |
|-------------|---------------|
| **Duolingo** | Gamification, streaks, celebrations |
| **Notion** | Sidebar, clean typography, block layout |
| **Linear** | Speed, keyboard shortcuts, dark polish |
| **Perplexity** | AI response presentation, citations |
| **Audible** | Audio player, reading progress |
| **Anki** | Spaced repetition feedback design |
| **Spotify** | Persistent bottom player, card grids |

---

*Document prepared by: BookWise AI Design System*  
*Version: 1.0 · Last updated: May 2026*  
*Status: Ready for implementation*
