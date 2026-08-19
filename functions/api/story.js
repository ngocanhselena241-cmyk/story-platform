import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

// GET /api/story?id=123
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing story id.");

  const story = await env.DB.prepare(
    `SELECT s.*, u.username AS author_name,
       (SELECT AVG(rating) FROM ratings r WHERE r.story_id = s.id) AS avg_rating,
       (SELECT COUNT(*) FROM ratings r WHERE r.story_id = s.id) AS rating_count
     FROM stories s JOIN users u ON u.id = s.author_id WHERE s.id = ?`
  ).bind(id).first();
  if (!story) return json({ error: "Story not found." }, 404);

  // Views are counted in /api/chapter — opening a story page is not a read.
  const { results: chapters } = await env.DB.prepare(
    `SELECT c.id, c.chapter_number, c.title, c.created_at, c.views,
            (SELECT COUNT(*) FROM comments cm WHERE cm.chapter_id = c.id) AS comment_count
     FROM chapters c WHERE c.story_id = ? ORDER BY c.chapter_number ASC`
  ).bind(id).all();

  return json({ story, chapters });
}

// PUT /api/story  { id, title, alt_title, credit_author, credit_illustrator, description, genres, status }  -- author or admin
export async function onRequestPut({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.id) return badRequest("Missing story id.");

  const story = await env.DB.prepare("SELECT author_id FROM stories WHERE id = ?").bind(body.id).first();
  if (!story) return json({ error: "Story not found." }, 404);
  if (story.author_id !== user.id && user.role !== "admin") return forbidden();

  if (body.cover && body.cover.length > 300000) return badRequest("Cover image is too large.");

  await env.DB.prepare(
    `UPDATE stories SET title = ?, alt_title = ?, credit_author = ?, credit_illustrator = ?, description = ?, genres = ?, status = ?, cover = COALESCE(?, cover), updated_at = ? WHERE id = ?`
  ).bind(
    body.title, (body.alt_title || "").trim(),
    (body.credit_author || "").trim(), (body.credit_illustrator || "").trim(),
    body.description || "", body.genres || "", body.status || "ongoing",
    body.cover || null, Date.now(), body.id
  ).run();

  return json({ ok: true });
}
