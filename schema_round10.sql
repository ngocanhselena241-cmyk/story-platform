-- Round 10: views are counted per chapter, and only when a chapter is opened.
ALTER TABLE chapters ADD COLUMN views INTEGER NOT NULL DEFAULT 0;
