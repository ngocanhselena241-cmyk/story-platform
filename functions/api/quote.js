import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/quote -> list the current user's saved quotes
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results } = await env.DB.prepare(
    `SELECT q.id, q.quote_text, q.created_at, s.id AS story_id, s.title AS story_title, c.chapter_number
     FROM quotes q
     JOIN stories s ON s.id = q.story_id
     JOIN chapters c ON c.id = q.chapter_id
     WHERE q.user_id = ? ORDER BY q.created_at DESC`
  ).bind(user.id).all();

  return json({ quotes: results });
}

// POST /api/quote  { chapter_id, quote_text }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.chapter_id || !body.quote_text || !body.quote_text.trim()) {
    return badRequest("chapter_id and quote_text are required.");
  }

  const chapter = await env.DB.prepare("SELECT story_id FROM chapters WHERE id = ?").bind(body.chapter_id).first();
  if (!chapter) return json({ error: "Chapter not found." }, 404);

  const result = await env.DB.prepare(
    "INSERT INTO quotes (user_id, chapter_id, story_id, quote_text, created_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(user.id, body.chapter_id, chapter.story_id, body.quote_text.trim(), Date.now()).run();

  return json({ id: result.meta.last_row_id });
}
