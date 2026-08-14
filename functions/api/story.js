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

  const { results: chapters } = await env.DB.prepare(
    "SELECT id, chapter_number, title, created_at FROM chapters WHERE story_id = ? ORDER BY chapter_number ASC"
  ).bind(id).all();

  // increment view count (best-effort, ignore errors)
  await env.DB.prepare("UPDATE stories SET views = views + 1 WHERE id = ?").bind(id).run();

  return json({ story, chapters });
}

// PUT /api/story  { id, title, description, genres, status }  -- author or admin
export async function onRequestPut({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.id) return badRequest("Missing story id.");

  const story = await env.DB.prepare("SELECT author_id FROM stories WHERE id = ?").bind(body.id).first();
  if (!story) return json({ error: "Story not found." }, 404);
  if (story.author_id !== user.id && user.role !== "admin") return forbidden();

  await env.DB.prepare(
    `UPDATE stories SET title = ?, description = ?, genres = ?, status = ?, updated_at = ? WHERE id = ?`
  ).bind(
    body.title, body.description || "", body.genres || "", body.status || "ongoing",
    Date.now(), body.id
  ).run();

  return json({ ok: true });
}
