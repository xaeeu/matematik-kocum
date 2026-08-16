PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  role TEXT NOT NULL CHECK(role IN ('superadmin','admin','student','parent')),
  name TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  owner_id TEXT NOT NULL REFERENCES users(id),
  parent_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  grade TEXT NOT NULL,
  service_type TEXT NOT NULL CHECK(service_type IN ('ozel_ders','kocluk','both')),
  group_name TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_schedules (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  hour INTEGER NOT NULL CHECK(hour BETWEEN 8 AND 23),
  status TEXT NOT NULL CHECK(status IN ('open','closed')),
  source TEXT NOT NULL DEFAULT 'manual',
  UNIQUE(teacher_id,date,hour)
);

CREATE TABLE IF NOT EXISTS schedule_rules (
  id TEXT PRIMARY KEY,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_hour INTEGER NOT NULL CHECK(start_hour BETWEEN 8 AND 23),
  end_hour INTEGER NOT NULL CHECK(end_hour BETWEEN 9 AND 24),
  action TEXT NOT NULL CHECK(action IN ('open','closed')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS lessons (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Matematik Dersi',
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS change_requests (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  parent_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  current_lesson_id TEXT NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  current_date TEXT NOT NULL,
  current_start TEXT NOT NULL,
  current_end TEXT NOT NULL,
  requested_date TEXT NOT NULL,
  requested_start TEXT NOT NULL,
  requested_end TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
  decision_note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  decided_at TEXT
);

CREATE TABLE IF NOT EXISTS evaluations (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  understanding INTEGER NOT NULL DEFAULT 0 CHECK(understanding BETWEEN 0 AND 100),
  homework_rate INTEGER NOT NULL DEFAULT 0 CHECK(homework_rate BETWEEN 0 AND 100),
  attendance INTEGER NOT NULL DEFAULT 0 CHECK(attendance BETWEEN 0 AND 100),
  problem_solving INTEGER NOT NULL DEFAULT 0 CHECK(problem_solving BETWEEN 0 AND 100),
  focus INTEGER NOT NULL DEFAULT 0 CHECK(focus BETWEEN 0 AND 100),
  consistency INTEGER NOT NULL DEFAULT 0 CHECK(consistency BETWEEN 0 AND 100),
  strengths TEXT NOT NULL DEFAULT '',
  focus_area TEXT NOT NULL DEFAULT '',
  next_goal TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coaching_plans (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE REFERENCES students(id) ON DELETE CASCADE,
  teacher_id TEXT NOT NULL REFERENCES users(id),
  weekly_goal TEXT NOT NULL DEFAULT '',
  focus TEXT NOT NULL DEFAULT '',
  habits TEXT NOT NULL DEFAULT '',
  next_meeting TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  student_id TEXT REFERENCES students(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('Deneme','Kazanım Sınavı')),
  exam_date TEXT NOT NULL,
  evaluation TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  number INTEGER NOT NULL,
  text TEXT NOT NULL,
  outcome TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  UNIQUE(exam_id,number)
);

CREATE TABLE IF NOT EXISTS exam_answers (
  id TEXT PRIMARY KEY,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL REFERENCES exam_questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL DEFAULT '',
  correct INTEGER NOT NULL DEFAULT 0 CHECK(correct IN (0,1)),
  UNIQUE(exam_id,student_id,question_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_students_owner ON students(owner_id);
CREATE INDEX IF NOT EXISTS idx_lessons_owner_date ON lessons(owner_id,date,start_time);
CREATE INDEX IF NOT EXISTS idx_requests_owner_status ON change_requests(owner_id,status);
CREATE INDEX IF NOT EXISTS idx_exam_answers_student ON exam_answers(student_id,exam_id);
