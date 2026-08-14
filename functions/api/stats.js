import { getUser, json, unauthorized } from "../_lib/auth.js";

// GET /api/stats -> chapters read, stories read, current streak
export async function onRequestGet({ request, env }) {
  const user = await getUser(request, env);
  if (!user) return unauthorized();

  const chaptersRow = await env.DB.prepare(
    "SELECT COUNT(DISTINCT chapter_id) AS n FROM reading_log WHERE user_id = ?"
  ).bind(user.id).first();

  const storiesRow = await env.DB.prepare(
    "SELECT COUNT(DISTINCT story_id) AS n FROM reading_log WHERE user_id = ?"
  ).bind(user.id).first();

  const { results: dateRows } = await env.DB.prepare(
    "SELECT DISTINCT read_date FROM reading_log WHERE user_id = ? ORDER BY read_date DESC"
  ).bind(user.id).all();

  const dates = new Set(dateRows.map(r => r.read_date));
  let streak = 0;
  let cursor = new Date();
  while (true) {
    const iso = cursor.toISOString().slice(0, 10);
    if (dates.has(iso)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      // allow today to be "not yet read" without breaking the streak
      if (streak === 0 && iso === new Date().toISOString().slice(0, 10)) {
        cursor.setDate(cursor.getDate() - 1);
        continue;
      }
      break;
    }
  }

  const achievements = [
    { icon: "📚", label: "First Chapter", earned: chaptersRow.n >= 1 },
    { icon: "📖", label: "10 Chapters Read", earned: chaptersRow.n >= 10 },
    { icon: "🏆", label: "50 Chapters Read", earned: chaptersRow.n >= 50 },
    { icon: "🌱", label: "3-Day Streak", earned: streak >= 3 },
    { icon: "🔥", label: "7-Day Streak", earned: streak >= 7 },
    { icon: "🌟", label: "5 Stories Started", earned: storiesRow.n >= 5 }
  ];

  return json({
    chapters_read: chaptersRow.n,
    stories_read: storiesRow.n,
    streak,
    achievements
  });
}
