# Goal Description
Now that the backend ingestion pipeline is successfully processing PDFs into chapters and concepts, it's time to build the user-facing interfaces to interact with this data. The goal is to transform BookWise AI from a file-uploader into an interactive learning companion by introducing Book Details, an AI Tutor Chat, and Knowledge Quizzes.

## Proposed Changes

We will implement three major feature verticals.

---

### Phase 1: Book Details & Concept Viewer
Users need a way to see what the AI learned from their book. We will make the books on the Dashboard clickable and build a detailed view.

#### [MODIFY] `src/app/(app)/dashboard/page.tsx`
- Make book items in the library list clickable (linking to `/books/[id]`).

#### [NEW] `src/app/(app)/books/[id]/page.tsx`
- A dynamic route that fetches a specific book, its `chapters`, and its `concepts`.
- UI will display standard metadata, a tabbed or expandable list of chapters (showing AI-generated summaries and difficulty), and a visualization of extracted concepts and their `mastery_state`.
- Include quick-action buttons: "Study with Tutor" and "Take a Quiz".

---

### Phase 2: AI Tutor Chat Interface
A conversational UI where users can ask questions specific to a book they uploaded.

#### [MODIFY] `src/app/(app)/tutor/page.tsx`
- Build a full-screen chat interface.
- Add a sidebar or dropdown to select which "Book" the user wants to chat about.
- Render conversational message history.

#### [MODIFY] `src/app/api/tutor/chat/route.ts`
- Implement the backend logic for the chat.
- It will receive user messages, retrieve relevant contextual concepts/summaries from the database for the selected book, and use the LLM (Gemini/Claude) to stream a contextualized response.

---

### Phase 3: Knowledge Check (Quiz Feature)
Testing the user's understanding of the concepts extracted during ingestion.

#### [MODIFY] `src/app/(app)/quiz/page.tsx`
- Build an assessment UI.
- Users select a book (or specific chapter) and hit "Start Quiz".
- The UI will render multiple-choice questions sequentially.
- On completion, it displays a score overview.

#### [MODIFY] `src/app/api/quiz/generate/route.ts` & `src/app/api/quiz/answer/route.ts`
- Backend logic to use the LLM to generate 3-5 multiple choice questions based on unmastered concepts from the book.
- Submit answers to update the `mastery_state` in the `concepts` table.

## Open Questions

> [!IMPORTANT]
> - Do you want to enforce a specific UI layout for the Tutor Chat (e.g., side-by-side with the book summary, or a dedicated full-page chat)?
> - Should we prioritize using Gemini or Claude for the Tutor and Quiz generation endpoints?

## Verification Plan
### Automated Tests
- N/A for UI components; we will rely on strict TypeScript types.
### Manual Verification
- We will upload a test PDF.
- We will click into the Book Details to verify summaries load correctly.
- We will engage the Tutor Chat to ensure it grounds its answers in the book's specific chapters.
- We will generate and complete a 3-question Quiz, verifying that concept mastery states update in Supabase.
