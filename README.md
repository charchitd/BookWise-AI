# 📚 BookWise AI

**Transform passive reading into an interactive, gamified learning experience.**

BookWise AI is an intelligent platform that turns static PDF documents and e-books into dynamic, bite-sized courses. Powered by advanced Large Language Models, it automatically ingests, segments, and curates your reading materials into manageable sessions—making complex subjects incredibly easy to digest, retain, and master.

---

## 🌟 Unique Selling Proposition (USP)
**Meet "Read": Your Interactive Voice Buddy**  
Unlike traditional e-readers or basic AI summarizers, BookWise AI features **"Read"**—a fully integrated, interactive female voice agent. Accessible via a dedicated, immersive visual dashboard, "Read" acts as your personal study partner. Using native browser speech recognition and text-to-speech, she allows you to brainstorm, ask questions, and discuss complex concepts entirely hands-free.

## 🚀 The Impact
BookWise AI is built to combat information overload and the modern attention economy. By breaking down massive, intimidating textbooks into gamified daily sessions (complete with Experience Points, daily streaks, and completion certificates), BookWise drastically improves **completion rates and deep knowledge retention**. It transforms the isolating experience of reading into an active, highly engaging conversation.

---

## ✨ Core Features

### 🧠 Intelligent Ingestion Engine
*   **Automated Curation:** Upload a PDF, and the AI pipeline (powered by models like Gemini and Claude) automatically extracts the text, resolves formatting issues, and segments the book into logical chapters.
*   **Concept Extraction:** Automatically identifies, extracts, and lists the critical "Key Concepts" from every chapter.
*   **Production-Ready Pipeline:** Built with batched concurrent AI processing, robust JSON retry mechanisms, and smart content truncation to efficiently handle large documents.

### 🎮 Gamified Learning & Progression
*   **Active Time Tracking:** A built-in study timer tracks your active reading minutes and syncs them to the server.
*   **XP & Streaks:** Earn Experience Points (XP) for studying and maintain daily learning streaks to stay motivated.
*   **Mastery System:** Track your understanding of concepts as they graduate from *New* ➡️ *Learning* ➡️ *Mastered*.
*   **Certificates:** Earn beautiful, animated Certificates of Completion once you master an entire book.

### 🛠️ Multi-Modal Study Environment
The Session Viewer offers a distraction-free, multi-tabbed interface tailored to different learning styles:
*   📝 **Study Notes:** Clean, formatted summaries and concept lists.
*   🎧 **Audio Summaries:** Follow along as the built-in audio player reads the chapter summary out loud.
*   🧠 **Dynamic Quizzes:** AI-generated multiple-choice quizzes that test your comprehension and directly update your concept mastery scores.
*   💬 **Text Tutor:** A classic AI chat interface for deep-diving into specific chapter paragraphs.

---

## 💻 Tech Stack
*   **Frontend Framework:** Next.js (App Router), React, TypeScript
*   **Styling & UI:** TailwindCSS, Lucide-React Icons
*   **Database & Authentication:** Supabase, PostgreSQL
*   **AI Providers:** OpenRouter (Gemini 2.5 Flash, Claude)
*   **Voice Integration:** Native Web Speech API (`SpeechRecognition` & `SpeechSynthesis`)

---

## 🚀 Getting Started Locally

1. **Clone the repository:**
   ```bash
   git clone https://github.com/charchitd/BookWise-AI.git
   cd bookwise-ai
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Ensure you have a `.env.local` file with your Supabase credentials and OpenRouter AI keys.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view it in the browser.
