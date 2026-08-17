-- Round 14: a story can carry a second, optional name (original title,
-- romanisation, English title...). Shown in parentheses next to the title
-- and matched by search just like the main one.
ALTER TABLE stories ADD COLUMN alt_title TEXT DEFAULT '';
