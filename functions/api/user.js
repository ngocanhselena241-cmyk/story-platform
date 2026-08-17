import { json, badRequest } from "../_lib/auth.js";

// GET /api/user?name=USERNAME -> public profile, shaped by role
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const name = url.searchParams.get("name");
  if (!name) return badRequest("Missing username.");

  const user = await env.DB.prepare(
    "SELECT id, username, role, bio, avatar, display_badge, created_at FROM users WHERE username = ?"
  ).bind(name).first();
  if (!user) return json({ error: "User not found." }, 404);

  const chaptersRow = await env.DB.prepare(
    "SELECT COUNT(DISTINCT chapter_id) AS n FROM reading_log WHERE user_id = ?"
  ).bind(user.id).first();
  const storiesReadRow = await env.DB.prepare(
    "SELECT COUNT(DISTINCT story_id) AS n FROM reading_log WHERE user_id = ?"
  ).bind(user.id).first();

  const badges = [
    { icon: "📚", label: "First Chapter", earned: chaptersRow.n >= 1 },
    { icon: "📖", label: "10 Chapters Read", earned: chaptersRow.n >= 10 },
    { icon: "🏆", label: "50 Chapters Read", earned: chaptersRow.n >= 50 },
    { icon: "🌟", label: "5 Stories Started", earned: storiesReadRow.n >= 5 }
  ].filter(b => b.earned);

  let stories = [];
  if (user.role === "uploader" || user.role === "admin") {
    ({ results: stories } = await env.DB.prepare(
      `SELECT s.id, s.title, s.alt_title, s.cover, s.genres, s.description, s.views,
              (SELECT MAX(chapter_number) FROM chapters c WHERE c.story_id = s.id) AS latest_chapter,
              (SELECT AVG(rating) FROM ratings r WHERE r.story_id = s.id) AS avg_rating
       FROM stories s WHERE s.author_id = ? AND s.approval_status = 'approved'
       ORDER BY s.updated_at DESC`
    ).bind(user.id).all());
  }

  return json({
    user: { username: user.username, role: user.role, bio: user.bio, avatar: user.avatar, created_at: user.created_at },
    reading: { chapters_read: chaptersRow.n, stories_read: storiesReadRow.n },
    badges,
    stories
  });
}
