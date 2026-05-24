export interface Book {
  id: string;
  user_id: string;
  title: string | null;
  author: string | null;
  total_pages: number | null;
  status: 'processing' | 'ready' | 'failed' | null;
  storage_url: string | null;
  created_at: string | null;
}

export interface Chapter {
  id: string;
  book_id: string | null;
  num: number | null;
  title: string | null;
  page_start: number | null;
  page_end: number | null;
  summary: string | null;
  difficulty: number | null;
  content: string | null;
  created_at: string | null;
}

export interface Concept {
  id: string;
  chapter_id: string | null;
  book_id: string | null;
  name: string | null;
  mastery_state: 'new' | 'learning' | 'mastered' | null;
  correct_attempts: number | null;
  last_tested: string | null;
  created_at: string | null;
}

export interface Embedding {
  id: string;
  book_id: string | null;
  chapter_id: string | null;
  chunk_text: string | null;
  embedding: number[] | null;
  page_num: number | null;
  created_at: string | null;
}

export interface Curriculum {
  id: string;
  book_id: string | null;
  user_id: string | null;
  mode: 'builder' | 'researcher' | 'beginner' | null;
  timeline_days: number | null;
  plan_json: any | null;
  created_at: string | null;
}

export interface QuizAttempt {
  id: string;
  user_id: string | null;
  chapter_id: string | null;
  book_id: string | null;
  question_json: any | null;
  selected_index: number | null;
  correct_index: number | null;
  is_correct: boolean | null;
  created_at: string | null;
}

export interface TutorSession {
  id: string;
  user_id: string | null;
  book_id: string | null;
  messages_json: any | null;
  started_at: string | null;
  updated_at: string | null;
}

export interface Note {
  id: string;
  user_id: string | null;
  book_id: string | null;
  chapter_id: string | null;
  content: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface UserUsage {
  id: string;
  user_id: string | null;
  books_uploaded: number | null;
  tutor_messages_sent: number | null;
  is_paid: boolean | null;
  plan: string | null;
  created_at: string | null;
}

export interface Profile {
  id: string;
  display_name: string | null;
  total_learning_minutes: number;
  created_at: string | null;
}
