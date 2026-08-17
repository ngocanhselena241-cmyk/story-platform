import { getUser, json, badRequest, unauthorized } from "../_lib/auth.js";

// GET /api/library-items  -- every story in every library of the logged-in user
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const { results: items } = await env.DB.prepare(
    `SELECT li.library_id, li.story_id, li.added_at, s.title, s.alt_title, s.cover
     FROM library_items li
     JOIN libraries lb ON lb.id = li.library_id
     JOIN stories s ON s.id = li.story_id
     WHERE lb.user_id = ?
     ORDER BY li.added_at DESC, li.id DESC`
  ).bind(user.id).all();

  return json({ items });
}

// POST /api/library-items  { story_id, library_ids: [] }
// Sets exactly which of the user's libraries hold this story.
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const body = await request.json().catch(() => null);
  if (!body || !body.story_id) return badRequest("Missing story id.");
  if (!Array.isArray(body.library_ids)) return badRequest("library_ids must be a list.");

  const story = await env.DB.prepare("SELECT id FROM stories WHERE id = ?").bind(body.story_id).first();
  if (!story) return badRequest("Story not found.");

  const { results: owned } = await env.DB.prepare(
    "SELECT id FROM libraries WHERE user_id = ?"
  ).bind(user.id).all();
  const ownedIds = new Set(owned.map(r => r.id));

  const wanted = [...new Set(body.library_ids.map(Number))].filter(id => ownedIds.has(id));

  // Drop it from the user's libraries that are no longer ticked...
  await env.DB.prepare(
    `DELETE FROM library_items
     WHERE story_id = ?
       AND library_id IN (SELECT id FROM libraries WHERE user_id = ?)`
  ).bind(body.story_id, user.id).run();

  // ...then add it to the ticked ones.
  const now = Date.now();
  for (const libraryId of wanted) {
    await env.DB.prepare(
      `INSERT INTO library_items (library_id, story_id, added_at) VALUES (?, ?, ?)
       ON CONFLICT(library_id, story_id) DO NOTHING`
    ).bind(libraryId, body.story_id, now).run();
  }

  return json({ ok: true, library_ids: wanted });
}

// DELETE /api/library-items?library=1&story=2
export async function onRequestDelete({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const url = new URL(request.url);
  const libraryId = url.searchParams.get("library");
  const storyId = url.searchParams.get("story");
  if (!libraryId || !storyId) return badRequest("Missing library or story id.");

  const owned = await env.DB.prepare(
    "SELECT id FROM libraries WHERE id = ? AND user_id = ?"
  ).bind(libraryId, user.id).first();
  if (!owned) return badRequest("Library not found.");

  await env.DB.prepare(
    "DELETE FROM library_items WHERE library_id = ? AND story_id = ?"
  ).bind(libraryId, storyId).run();

  return json({ ok: true });
}
