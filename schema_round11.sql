-- Round 11: every comment can be replied to and voted on.
ALTER TABLE thread_comments ADD COLUMN parent_id INTEGER;

-- Votes on chapter/paragraph comments
CREATE TABLE comment_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  vote INTEGER NOT NULL, -- 1 like, -1 dislike
  UNIQUE(comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Votes on discussion comments
CREATE TABLE thread_comment_votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  comment_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  vote INTEGER NOT NULL,
  UNIQUE(comment_id, user_id),
  FOREIGN KEY (comment_id) REFERENCES thread_comments(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
