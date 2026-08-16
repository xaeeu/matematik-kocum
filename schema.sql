PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK (role IN ('superadmin','admin','student','parent')),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE,
  owner_id TEXT NOT NULL,
  parent_user_id TEXT,
  grade TEXT,
  service_type TEXT NOT NULL DEFAULT 'ozel_ders',
  group_name TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS teacher_schedules (
  teacher_id TEXT PRIMARY KEY,
  settings_json TEXT NOT NULL DEFAULT '{}',
  FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_lessons_teacher_date ON lessons(owner_id, date);
CREATE INDEX IF NOT EXISTS idx_lessons_student_date ON lessons(student_id, date);

CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  parent_user_id TEXT,
  lesson_id TEXT NOT NULL,
  current_date TEXT NOT NULL,
  current_start TEXT NOT NULL,
  current_end TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  requested_start TEXT NOT NULL,
  requested_end TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  decision_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY(lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  teacher_id TEXT NOT NULL,
  scores_json TEXT NOT NULL,
  note TEXT,
  strengths TEXT,
  focus_area TEXT,
  next_goal TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  student_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  exam_date TEXT,
  evaluation TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  outcome TEXT NOT NULL,
  correct_answer TEXT,
  FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS exam_results (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL,
  student_id TEXT NOT NULL,
  score REAL,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  blank_count INTEGER NOT NULL DEFAULT 0,
  evaluation TEXT,
  answers_json TEXT NOT NULL DEFAULT '[]',
  FOREIGN KEY(exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS coaching (
  student_id TEXT PRIMARY KEY,
  weekly_goal TEXT,
  focus TEXT,
  habits TEXT,
  next_meeting TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(student_id) REFERENCES students(id) ON DELETE CASCADE
);
