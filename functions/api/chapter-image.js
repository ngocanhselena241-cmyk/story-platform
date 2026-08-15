import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

const MAX_IMAGE = 400000; // ~400KB of base64

// Only the story's own author may add or remove pictures in its chapters —
// deliberately not admins, since this is the author's illustration work,
// not a moderation concern (admins still remove the lot via chapter/story delete).
async function canEdit(env, user, chapterId) {
  const row = await env.DB.prepare(
    `SELECT s.author_id FROM chapters c JOIN stories s ON s.id = c.story_id WHERE c.id = ?`
  ).bind(chapterId).first();
  if (!row) return null;
  return row.author_id === user.id;
}

// GET /api/chapter-image?chapter=123  -- images for a chapter, in reading order
export async function onRequestGet({ request, env }) {
  const chapterId = new URL(request.url).searchParams.get("chapter");
  if (!chapterId) return badRequest("Missing chapter id.");

  const { results } = await env.DB.prepare(
    `SELECT id, paragraph_index, image, caption FROM chapter_images
     WHERE chapter_id = ? ORDER BY paragraph_index, id`
  ).bind(chapterId).all();

  return json({ images: results });
}

// POST /api/chapter-image  { chapter_id, paragraph_index, image, caption? }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.chapter_id || !body.image) return badRequest("chapter_id and image are required.");
  if (!Number.isInteger(body.paragraph_index) || body.paragraph_index < 0) {
    return badRequest("paragraph_index is required.");
  }
  if (body.image.length > MAX_IMAGE) return badRequest("That image is too large — try a smaller one.");

  const allowed = await canEdit(env, user, body.chapter_id);
  if (allowed === null) return json({ error: "Chapter not found." }, 404);
  if (!allowed) return forbidden();

  const { meta } = await env.DB.prepare(
    `INSERT INTO chapter_images (chapter_id, paragraph_index, image, caption, created_at)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(body.chapter_id, body.paragraph_index, body.image, (body.caption || "").trim(), Date.now()).run();

  return json({ id: meta.last_row_id });
}

// DELETE /api/chapter-image?id=5
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("Missing image id.");

  const row = await env.DB.prepare("SELECT chapter_id FROM chapter_images WHERE id = ?").bind(id).first();
  if (!row) return json({ error: "Image not found." }, 404);

  const allowed = await canEdit(env, user, row.chapter_id);
  if (!allowed) return forbidden();

  await env.DB.prepare("DELETE FROM chapter_images WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
