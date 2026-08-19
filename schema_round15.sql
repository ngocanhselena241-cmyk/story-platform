-- Round 15: credit the people behind the story — the author who wrote it and
-- the illustrator who drew it — separately from the uploader account. Shown
-- under the title on the story page (not on the hover panel, which is already
-- busy) and matched by search alongside the titles.
ALTER TABLE stories ADD COLUMN credit_author TEXT DEFAULT '';
ALTER TABLE stories ADD COLUMN credit_illustrator TEXT DEFAULT '';
