import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

const VALID_MOODS = ["😭", "❤️", "🔥", "😂", "😱", "💀", "⚡"];

// POST /api/mood  { chapter_id, mood }  -- toggles: adds if not set, removes if already set
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.chapter_id || !VALID_MOODS.includes(body.mood)) {
    return badRequest("chapter_id and a valid mood are required.");
  }

  const existing = await env.DB.prepare(
    "SELECT id FROM chapter_moods WHERE chapter_id = ? AND user_id = ? AND mood = ?"
  ).bind(body.chapter_id, user.id, body.mood).first();

  if (existing) {
    await env.DB.prepare("DELETE FROM chapter_moods WHERE id = ?").bind(existing.id).run();
    return json({ active: false });
  } else {
    await env.DB.prepare(
      "INSERT INTO chapter_moods (chapter_id, user_id, mood, created_at) VALUES (?, ?, ?, ?)"
    ).bind(body.chapter_id, user.id, body.mood, Date.now()).run();
    return json({ active: true });
  }
}
