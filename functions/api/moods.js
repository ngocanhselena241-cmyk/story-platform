import { getUser, json, badRequest } from "../_lib/auth.js";

// GET /api/moods?story=ID -> top mood per chapter, for the story timeline
// GET /api/moods?chapter=ID -> this chapter's mood counts + which ones the current user picked
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const storyId = url.searchParams.get("story");
  const chapterId = url.searchParams.get("chapter");

  if (storyId) {
    const { results } = await env.DB.prepare(
      `SELECT c.chapter_number, cm.mood, COUNT(*) AS votes
       FROM chapter_moods cm
       JOIN chapters c ON c.id = cm.chapter_id
       WHERE c.story_id = ?
       GROUP BY c.chapter_number, cm.mood
       ORDER BY c.chapter_number ASC`
    ).bind(storyId).all();

    // Pick the top mood per chapter
    const topByChapter = {};
    for (const row of results) {
      if (!topByChapter[row.chapter_number] || row.votes > topByChapter[row.chapter_number].votes) {
        topByChapter[row.chapter_number] = row;
      }
    }
    return json({ timeline: Object.values(topByChapter) });
  }

  if (chapterId) {
    const { results } = await env.DB.prepare(
      "SELECT mood, COUNT(*) AS votes FROM chapter_moods WHERE chapter_id = ? GROUP BY mood ORDER BY votes DESC"
    ).bind(chapterId).all();

    const user = await getUser(request, env);
    let mine = [];
    if (user) {
      const { results: mineRows } = await env.DB.prepare(
        "SELECT mood FROM chapter_moods WHERE chapter_id = ? AND user_id = ?"
      ).bind(chapterId, user.id).all();
      mine = mineRows.map(r => r.mood);
    }
    return json({ counts: results, mine });
  }

  return badRequest("Provide story or chapter.");
}
