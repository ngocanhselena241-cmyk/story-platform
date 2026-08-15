import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/profile -> current user's full profile (incl. avatar)
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  const full = await env.DB.prepare(
    "SELECT id, username, email, role, bio, avatar, display_badge, created_at FROM users WHERE id = ?"
  ).bind(user.id).first();
  return json({ profile: full });
}

// PUT /api/profile  { username?, bio?, avatar? }  avatar = base64 data URL, max ~150KB
export async function onRequestPut({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body) return badRequest("Nothing to update.");

  if (body.avatar && body.avatar.length > 200000) {
    return badRequest("Avatar image is too large.");
  }

  // Renaming: same rules as sign-up, and the name has to still be free.
  let username = null;
  if (typeof body.username === "string" && body.username.trim() !== user.username) {
    username = body.username.trim();
    if (username.length < 3 || username.length > 20) {
      return badRequest("Username must be between 3 and 20 characters.");
    }
    if (!/^[A-Za-z0-9._-]+$/.test(username)) {
      return badRequest("Username can only use letters, numbers, dots, dashes and underscores.");
    }
    const taken = await env.DB.prepare(
      "SELECT id FROM users WHERE username = ? COLLATE NOCASE AND id != ?"
    ).bind(username, user.id).first();
    if (taken) return badRequest("That username is already taken.");
  }

  await env.DB.prepare(
    `UPDATE users SET username = COALESCE(?, username), bio = COALESCE(?, bio),
                      avatar = COALESCE(?, avatar), display_badge = COALESCE(?, display_badge)
     WHERE id = ?`
  ).bind(username, body.bio ?? null, body.avatar ?? null, body.display_badge ?? null, user.id).run();

  return json({ ok: true, username: username || user.username });
}
