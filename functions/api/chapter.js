import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

// GET /api/chapter?story=123&num=4
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const storyId = url.searchParams.get("story");
  const num = url.searchParams.get("num");
  if (!storyId || !num) return badRequest("Missing story or chapter number.");

  const chapter = await env.DB.prepare(
    "SELECT * FROM chapters WHERE story_id = ? AND chapter_number = ?"
  ).bind(storyId, num).first();
  if (!chapter) return json({ error: "Chapter not found." }, 404);

  const story = await env.DB.prepare("SELECT id, title, author_id FROM stories WHERE id = ?").bind(storyId).first();

  const prev = await env.DB.prepare(
    "SELECT chapter_number FROM chapters WHERE story_id = ? AND chapter_number < ? ORDER BY chapter_number DESC LIMIT 1"
  ).bind(storyId, num).first();
  const next = await env.DB.prepare(
    "SELECT chapter_number FROM chapters WHERE story_id = ? AND chapter_number > ? ORDER BY chapter_number ASC LIMIT 1"
  ).bind(storyId, num).first();

  // A view is one chapter actually being opened — counted per chapter and on the story.
  await env.DB.prepare("UPDATE chapters SET views = views + 1 WHERE id = ?").bind(chapter.id).run();
  await env.DB.prepare("UPDATE stories SET views = views + 1 WHERE id = ?").bind(storyId).run();

  return json({
    chapter: { ...chapter, views: (chapter.views || 0) + 1 },
    story,
    prev_chapter: prev ? prev.chapter_number : null,
    next_chapter: next ? next.chapter_number : null
  });
}

// POST /api/chapter  { story_id, chapter_number, title, content }  -- author or admin
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.story_id || !body.chapter_number || !body.content) {
    return badRequest("story_id, chapter_number, and content are required.");
  }

  const story = await env.DB.prepare("SELECT author_id, title FROM stories WHERE id = ?").bind(body.story_id).first();
  if (!story) return json({ error: "Story not found." }, 404);
  if (story.author_id !== user.id && user.role !== "admin") return forbidden();

  const existing = await env.DB.prepare(
    "SELECT id FROM chapters WHERE story_id = ? AND chapter_number = ?"
  ).bind(body.story_id, body.chapter_number).first();

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO chapters (story_id, chapter_number, title, content, created_at) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(story_id, chapter_number) DO UPDATE SET title = excluded.title, content = excluded.content`
  ).bind(body.story_id, body.chapter_number, body.title || "", body.content, now).run();

  await env.DB.prepare("UPDATE stories SET updated_at = ? WHERE id = ?").bind(now, body.story_id).run();

  // Brand-new chapter (not an edit): notify followers
  if (!existing) {
    const { results: followers } = await env.DB.prepare(
      "SELECT user_id FROM follows WHERE story_id = ?"
    ).bind(body.story_id).all();
    for (const f of followers) {
      if (f.user_id === user.id) continue;
      await env.DB.prepare(
        "INSERT INTO notifications (user_id, story_id, chapter_number, message, created_at) VALUES (?, ?, ?, ?, ?)"
      ).bind(f.user_id, body.story_id, body.chapter_number,
        `${story.title} — Chapter ${body.chapter_number} is out!`, now).run();
    }
  }

  return json({ ok: true });
}
