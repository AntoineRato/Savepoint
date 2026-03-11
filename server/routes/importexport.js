const express = require('express');
const router = express.Router();
const db = require('../db');

function parseGame(row) {
  if (!row) return null;
  return {
    ...row,
    genres:      JSON.parse(row.genres      || '[]'),
    tags:        JSON.parse(row.tags        || '[]'),
    screenshots: JSON.parse(row.screenshots || '[]'),
  };
}

function serializeGame(data) {
  const out = { ...data };
  if (Array.isArray(out.genres))      out.genres      = JSON.stringify(out.genres);
  if (Array.isArray(out.tags))        out.tags        = JSON.stringify(out.tags);
  if (Array.isArray(out.screenshots)) out.screenshots = JSON.stringify(out.screenshots);
  return out;
}

// GET /api/export
router.get('/export', (req, res) => {
  const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
  res.json(games.map(parseGame));
});

// POST /api/import
router.post('/import', (req, res) => {
  const games = req.body;
  if (!Array.isArray(games)) return res.status(400).json({ error: 'Expected array' });

  let imported = 0;
  let overwritten = 0;

  const upsertByRawgId = db.prepare(`
    UPDATE games SET title=?, genre=?, genres=?, tags=?, status=?, rating=?,
      hours_played=?, date_started=?, date_finished=?, notes=?, cover_url=?,
      steam_app_id=?, release_date=?, developer=?, publisher=?,
      metascore=?, screenshots=?, metadata_updated=?
    WHERE rawg_id=?
  `);

  const insertNew = db.prepare(`
    INSERT INTO games (title, genre, genres, tags, status, rating, hours_played,
      date_started, date_finished, notes, cover_url, steam_app_id, rawg_id,
      release_date, developer, publisher, metascore, screenshots, metadata_updated)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const doImport = db.transaction(() => {
    for (const game of games) {
      const s = serializeGame(game);

      if (s.rawg_id) {
        const result = upsertByRawgId.run(
          s.title, s.genre ?? null, s.genres ?? null, s.tags ?? null,
          s.status ?? 'backlog', s.rating ?? null, s.hours_played ?? null,
          s.date_started ?? null, s.date_finished ?? null, s.notes ?? null,
          s.cover_url ?? null, s.steam_app_id ?? null,
          s.release_date ?? null, s.developer ?? null, s.publisher ?? null,
          s.metascore ?? null, s.screenshots ?? null, s.metadata_updated ?? null,
          s.rawg_id
        );
        if (result.changes > 0) {
          overwritten++;
          imported++;
          continue;
        }
      }

      insertNew.run(
        s.title, s.genre ?? null, s.genres ?? null, s.tags ?? null,
        s.status ?? 'backlog', s.rating ?? null, s.hours_played ?? null,
        s.date_started ?? null, s.date_finished ?? null, s.notes ?? null,
        s.cover_url ?? null, s.steam_app_id ?? null, s.rawg_id ?? null,
        s.release_date ?? null, s.developer ?? null, s.publisher ?? null,
        s.metascore ?? null, s.screenshots ?? null, s.metadata_updated ?? null
      );
      imported++;
    }
  });

  doImport();
  res.json({ imported, overwritten });
});

module.exports = router;
