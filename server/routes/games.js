const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
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

// GET all games
router.get('/', (req, res) => {
  const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
  res.json(games.map(parseGame));
});

// POST refresh-metadata — must be BEFORE GET /:id
router.post('/refresh-metadata', async (req, res) => {
  const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'rawg_key'").get();
  if (!keyRow?.value) return res.status(400).json({ error: 'RAWG key missing' });

  const candidates = db.prepare(`
    SELECT * FROM games
    WHERE rawg_id IS NOT NULL
      AND (metadata_updated IS NULL
           OR metadata_updated < datetime('now', '-24 hours'))
    LIMIT 50
  `).all();

  const key = keyRow.value;
  let updated = 0;

  const updateStmt = db.prepare(`
    UPDATE games SET genres=?, tags=?, release_date=?, developer=?,
      publisher=?, metascore=?, screenshots=?, metadata_updated=?
    WHERE id=?
  `);

  for (const game of candidates) {
    try {
      const [detail, stores, screens] = await Promise.all([
        fetch(`https://api.rawg.io/api/games/${game.rawg_id}?key=${key}`).then(r => r.json()),
        fetch(`https://api.rawg.io/api/games/${game.rawg_id}/stores?key=${key}`).then(r => r.json()),
        fetch(`https://api.rawg.io/api/games/${game.rawg_id}/screenshots?key=${key}&page_size=6`).then(r => r.json()),
      ]);

      let steam_app_id = game.steam_app_id;
      for (const s of stores.results || []) {
        const match = s.url?.match(/store\.steampowered\.com\/app\/(\d+)/);
        if (match) { steam_app_id = parseInt(match[1], 10); break; }
      }

      updateStmt.run(
        JSON.stringify((detail.genres || []).map(g => g.name)),
        JSON.stringify((detail.tags || []).slice(0, 20).map(t => t.name)),
        detail.released ?? null,
        detail.developers?.[0]?.name ?? null,
        detail.publishers?.[0]?.name ?? null,
        detail.metacritic ?? null,
        JSON.stringify((screens.results || []).map(s => s.image)),
        new Date().toISOString(),
        game.id
      );
      if (steam_app_id !== game.steam_app_id) {
        db.prepare('UPDATE games SET steam_app_id=? WHERE id=?').run(steam_app_id, game.id);
      }
      updated++;
    } catch { /* silently skip failed games */ }
  }

  res.json({ updated });
});

// GET single game
router.get('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(parseGame(game));
});

// POST new game
router.post('/', (req, res) => {
  const { title, genre, status, rating, hours_played, date_started, date_finished, notes, cover_url, steam_app_id, rawg_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const duplicate = rawg_id
    ? db.prepare('SELECT id FROM games WHERE rawg_id = ?').get(rawg_id)
    : db.prepare('SELECT id FROM games WHERE LOWER(title) = LOWER(?)').get(title);
  if (duplicate) return res.status(409).json({ error: `"${title}" is already in your list.` });

  const s = serializeGame(req.body);
  const hasEnrichedFields = s.genres || s.tags || s.release_date || s.developer || s.publisher || s.metascore || s.screenshots;
  const metadata_updated = hasEnrichedFields ? new Date().toISOString() : null;

  const result = db.prepare(`
    INSERT INTO games (title, genre, genres, tags, status, rating, hours_played, date_started, date_finished, notes, cover_url, steam_app_id, rawg_id, release_date, developer, publisher, metascore, screenshots, metadata_updated)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, genre || null, s.genres || null, s.tags || null,
    status || 'backlog', rating || null, hours_played || null,
    date_started || null, date_finished || null, notes || null,
    cover_url || null, steam_app_id || null, rawg_id || null,
    s.release_date || null, s.developer || null, s.publisher || null,
    s.metascore || null, s.screenshots || null, metadata_updated
  );

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(parseGame(game));
});

// PUT update game
router.put('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { title, genre, status, rating, hours_played, date_started, date_finished, notes, cover_url, steam_app_id, rawg_id } = req.body;
  const s = serializeGame(req.body);

  const hasEnrichedFields = s.genres || s.tags || s.release_date || s.developer || s.publisher || s.metascore !== undefined || s.screenshots;
  const metadata_updated = hasEnrichedFields ? new Date().toISOString() : game.metadata_updated;

  db.prepare(`
    UPDATE games SET
      title = ?, genre = ?, genres = ?, tags = ?, status = ?, rating = ?, hours_played = ?,
      date_started = ?, date_finished = ?, notes = ?, cover_url = ?,
      steam_app_id = ?, rawg_id = ?, release_date = ?, developer = ?, publisher = ?,
      metascore = ?, screenshots = ?, metadata_updated = ?
    WHERE id = ?
  `).run(
    title ?? game.title,
    genre !== undefined ? (genre || null) : game.genre,
    s.genres !== undefined ? (s.genres || null) : game.genres,
    s.tags !== undefined ? (s.tags || null) : game.tags,
    status ?? game.status,
    rating !== undefined ? (rating || null) : game.rating,
    hours_played !== undefined ? (hours_played || null) : game.hours_played,
    date_started !== undefined ? (date_started || null) : game.date_started,
    date_finished !== undefined ? (date_finished || null) : game.date_finished,
    notes !== undefined ? (notes || null) : game.notes,
    cover_url !== undefined ? (cover_url || null) : game.cover_url,
    steam_app_id !== undefined ? (steam_app_id || null) : game.steam_app_id,
    rawg_id !== undefined ? (rawg_id || null) : game.rawg_id,
    s.release_date !== undefined ? (s.release_date || null) : game.release_date,
    s.developer !== undefined ? (s.developer || null) : game.developer,
    s.publisher !== undefined ? (s.publisher || null) : game.publisher,
    s.metascore !== undefined ? (s.metascore || null) : game.metascore,
    s.screenshots !== undefined ? (s.screenshots || null) : game.screenshots,
    metadata_updated,
    req.params.id
  );

  res.json(parseGame(db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id)));
});

// DELETE game
router.delete('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
