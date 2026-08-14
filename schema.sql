-- Users: readers, uploaders, admins
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'reader', -- 'reader' | 'uploader' | 'admin'
  bio TEXT DEFAULT '',
  created_at INTEGER NOT NULL
);

-- Sessions for login (cookie stores the token)
CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Stories
CREATE TABLE stories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  author_id INTEGER NOT NULL,
  description TEXT DEFAULT '',
  genres TEXT DEFAULT '',           -- comma-separated
  status TEXT NOT NULL DEFAULT 'ongoing', -- ongoing | completed | hiatus
  approval_status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  views INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Chapters
CREATE TABLE chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  chapter_number INTEGER NOT NULL,
  title TEXT DEFAULT '',
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (story_id) REFERENCES stories(id),
  UNIQUE(story_id, chapter_number)
);

-- Comments (attached to a chapter)
CREATE TABLE comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ratings (1-10 per user per story)
CREATE TABLE ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  story_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rating INTEGER NOT NULL,
  UNIQUE(story_id, user_id),
  FOREIGN KEY (story_id) REFERENCES stories(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Reading progress (for "Continue Reading")
CREATE TABLE reading_progress (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, story_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (story_id) REFERENCES stories(id),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);

-- Follows / library status
CREATE TABLE library (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'reading', -- reading | plan_to_read | completed | on_hold | dropped | favourite
  UNIQUE(user_id, story_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (story_id) REFERENCES stories(id)
);
