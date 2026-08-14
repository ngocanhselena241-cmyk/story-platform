import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/profile -> current user's full profile (incl. avatar)
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  const full = await env.DB.prepare(
    "SELECT id, username, email, role, bio, avatar, created_at FROM users WHERE id = ?"
  ).bind(user.id).first();
  return json({ profile: full });
}

// PUT /api/profile  { bio?, avatar? }  avatar = base64 data URL, max ~150KB
export async function onRequestPut({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return badRequest("Nothing to update.");

  if (body.avatar && body.avatar.length > 200000) {
    return badRequest("Avatar image is too large.");
  }

  await env.DB.prepare("UPDATE users SET bio = COALESCE(?, bio), avatar = COALESCE(?, avatar) WHERE id = ?")
    .bind(body.bio ?? null, body.avatar ?? null, user.id).run();

  return json({ ok: true });
}
