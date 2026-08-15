import { getUser, json, unauthorized } from "../_lib/auth.js";

// GET /api/notifications -> latest 20 + unread count
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results } = await env.DB.prepare(
    "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20"
  ).bind(user.id).all();

  const unread = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0"
  ).bind(user.id).first();

  return json({ notifications: results, unread: unread.n });
}

// POST /api/notifications -> mark all read
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  await env.DB.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").bind(user.id).run();
  return json({ ok: true });
}
