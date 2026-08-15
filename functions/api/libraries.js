import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

const MAX_NAME = 60;

function cleanName(raw) {
  return typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
}

// GET /api/libraries            -- the user's libraries
// GET /api/libraries?story=123  -- same, plus has_story on each
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const storyId = new URL(request.url).searchParams.get("story");

  const { results: libraries } = await env.DB.prepare(
    `SELECT lb.id, lb.name, lb.created_at,
            (SELECT COUNT(*) FROM library_items li WHERE li.library_id = lb.id) AS story_count
     FROM libraries lb WHERE lb.user_id = ? ORDER BY lb.created_at, lb.id`
  ).bind(user.id).all();

  if (storyId) {
    const { results: holding } = await env.DB.prepare(
      `SELECT li.library_id FROM library_items li
       JOIN libraries lb ON lb.id = li.library_id
       WHERE lb.user_id = ? AND li.story_id = ?`
    ).bind(user.id, storyId).all();
    const inLibrary = new Set(holding.map(r => r.library_id));
    libraries.forEach(lb => { lb.has_story = inLibrary.has(lb.id); });
  }

  return json({ libraries });
}

// POST /api/libraries  { name }
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  const name = cleanName(body && body.name);
  if (!name) return badRequest("Give your library a name.");
  if (name.length > MAX_NAME) return badRequest(`Keep the name under ${MAX_NAME} characters.`);

  const clash = await env.DB.prepare(
    "SELECT id FROM libraries WHERE user_id = ? AND name = ? COLLATE NOCASE"
  ).bind(user.id, name).first();
  if (clash) return badRequest("You already have a library with that name.");

  const { meta } = await env.DB.prepare(
    "INSERT INTO libraries (user_id, name, created_at) VALUES (?, ?, ?)"
  ).bind(user.id, name, Date.now()).run();

  return json({ library: { id: meta.last_row_id, name, story_count: 0, has_story: false } });
}

// PUT /api/libraries  { id, name }
export async function onRequestPut({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.id) return badRequest("Missing library id.");
  const name = cleanName(body.name);
  if (!name) return badRequest("Give your library a name.");
  if (name.length > MAX_NAME) return badRequest(`Keep the name under ${MAX_NAME} characters.`);

  const owned = await env.DB.prepare(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?"
  ).bind(body.id, user.id).first();
  if (!owned) return badRequest("Library not found.");

  const clash = await env.DB.prepare(
    "SELECT id FROM libraries WHERE user_id = ? AND name = ? COLLATE NOCASE AND id != ?"
  ).bind(user.id, name, body.id).first();
  if (clash) return badRequest("You already have a library with that name.");

  await env.DB.prepare("UPDATE libraries SET name = ? WHERE id = ?").bind(name, body.id).run();
  return json({ ok: true });
}

// DELETE /api/libraries?id=123
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return badRequest("Missing library id.");

  const owned = await env.DB.prepare(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?"
  ).bind(id, user.id).first();
  if (!owned) return badRequest("Library not found.");

  await env.DB.prepare("DELETE FROM library_items WHERE library_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM libraries WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
