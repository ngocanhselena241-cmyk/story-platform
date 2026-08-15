-- Round 9: user-created libraries. A story can live in several libraries at once,
-- replacing the old single fixed-status shelf.

CREATE TABLE libraries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  UNIQUE(user_id, name),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE library_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  library_id INTEGER NOT NULL,
  story_id INTEGER NOT NULL,
  added_at INTEGER NOT NULL,
  UNIQUE(library_id, story_id),
  FOREIGN KEY (library_id) REFERENCES libraries(id),
  FOREIGN KEY (story_id) REFERENCES stories(id)
);

-- Turn each status a user actually used into a named library of theirs.
INSERT INTO libraries (user_id, name, created_at)
SELECT DISTINCT user_id,
  CASE status
    WHEN 'reading' THEN 'Reading'
    WHEN 'plan_to_read' THEN 'Plan to Read'
    WHEN 'completed' THEN 'Completed'
    WHEN 'on_hold' THEN 'On Hold'
    WHEN 'dropped' THEN 'Dropped'
    WHEN 'favourite' THEN 'Favourite'
    ELSE status
  END,
  CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM library;

INSERT INTO library_items (library_id, story_id, added_at)
SELECT lb.id, l.story_id, CAST(strftime('%s', 'now') AS INTEGER) * 1000
FROM library l
JOIN libraries lb ON lb.user_id = l.user_id AND lb.name =
  CASE l.status
    WHEN 'reading' THEN 'Reading'
    WHEN 'plan_to_read' THEN 'Plan to Read'
    WHEN 'completed' THEN 'Completed'
    WHEN 'on_hold' THEN 'On Hold'
    WHEN 'dropped' THEN 'Dropped'
    WHEN 'favourite' THEN 'Favourite'
    ELSE l.status
  END;

DROP TABLE library;
