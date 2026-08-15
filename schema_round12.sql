-- Round 12: uploaders can drop images between the paragraphs of their chapters.
CREATE TABLE chapter_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  paragraph_index INTEGER NOT NULL, -- image is shown right after this paragraph
  image TEXT NOT NULL,              -- base64 data URL
  caption TEXT DEFAULT '',
  created_at INTEGER NOT NULL,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id)
);
