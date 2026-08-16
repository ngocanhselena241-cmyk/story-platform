import { getUser, json, badRequest, unauthorized, forbidden } from "../_lib/auth.js";

// GET /api/stories?sort=updated|rating|new&genre=X&q=search
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "updated";
  const genre = url.searchParams.get("genre");
  const q = url.searchParams.get("q");
  const status = url.searchParams.get("status");

  let sql = `
    SELECT s.id, s.title, s.description, s.genres, s.status, s.views, s.updated_at, s.cover,
           u.username AS author_name,
           (SELECT COUNT(*) FROM chapters c WHERE c.story_id = s.id) AS chapter_count,
           (SELECT MAX(chapter_number) FROM chapters c WHERE c.story_id = s.id) AS latest_chapter,
           (SELECT AVG(rating) FROM ratings r WHERE r.story_id = s.id) AS avg_rating
    FROM stories s
    JOIN users u ON u.id = s.author_id
    WHERE s.approval_status = 'approved'
  `;
  const params = [];
  if (genre) {
    // supports multiple comma-separated tags: story must match ALL of them
    genre.split(",").map(g => g.trim()).filter(Boolean).forEach(g => {
      sql += " AND s.genres LIKE ?";
      params.push(`%${g}%`);
    });
  }
  if (q) { sql += " AND s.title LIKE ?"; params.push(`%${q}%`); }
  if (status) { sql += " AND s.status = ?"; params.push(status); }

  if (sort === "rating") sql += " ORDER BY avg_rating DESC";
  else if (sort === "new") sql += " ORDER BY s.created_at DESC";
  else if (sort === "popular") sql += " ORDER BY s.views DESC";
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

  if (body.cover && body.cover.length > 300000) return badRequest("Cover image is too large.");

  const result = await env.DB.prepare(
    `INSERT INTO stories (title, author_id, description, genres, status, approval_status, cover, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    body.title, user.id, body.description || "", body.genres || "",
    body.status || "ongoing", approvalStatus, body.cover || null, now, now
  ).run();

  return json({ id: result.meta.last_row_id, approval_status: approvalStatus });
}
