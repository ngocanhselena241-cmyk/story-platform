-- Round 2: moods, quotes, reading log for stats/streaks

CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  quote_text TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE chapter_moods (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  mood TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(chapter_id, user_id, mood)
);

CREATE TABLE reading_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  chapter_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  read_date TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, chapter_id)
);
