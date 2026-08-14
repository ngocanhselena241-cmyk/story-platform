import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

// GET /api/stories?sort=updated|rating|new&genre=X&q=search
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "updated";
  const genre = url.searchParams.get("genre");
  const q = url.searchParams.get("q");

  let sql = `
    SELECT s.id, s.title, s.description, s.genres, s.status, s.views, s.updated_at,
           u.username AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS chapter_count,
           (SELECT AVG(rating) FROM ratings r WHERE r.story_id = s.id) AS avg_rating
    FROM stories s
    JOIN users u ON u.id = s.author_id
    WHERE s.approval_status = 'approved'
  `;
  const params = [];
  if (genre) { sql += " AND s.genres LIKE ?"; params.push(`%${genre}%`); }
  if (q) { sql += " AND s.title LIKE ?"; params.push(`%${q}%`); }

  if (sort === "rating") sql += " ORDER BY avg_rating DESC";
  else if (sort === "new") sql += " ORDER BY s.created_at DESC";
  else sql += " ORDER BY s.updated_at DESC";
  sql += " LIMIT 50";

  const { results } = await env.DB.prepare(sql).bind(...params).all();
  return json({ stories: results });
}

// POST /api/stories  { title, description, genres, status }  -- uploader or admin only
export async function onRequestPost({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();
  if (user.role !== "uploader" && user.role !== "admin") return forbidden();

  const body = await request.json().catch(() => null);
  if (!body || !body.title) return badRequest("Title is required.");

  const now = Date.now();
  const approvalStatus = user.role === "admin" ? "approved" : "pending";

  const result = await env.DB.prepare(
    `INSERT INTO stories (title, author_id, description, genres, status, approval_status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.title, user.id, body.description || "", body.genres || "",
    body.status || "ongoing", approvalStatus, now, now
  ).run();

  return json({ id: result.meta.last_row_id, approval_status: approvalStatus });
}
