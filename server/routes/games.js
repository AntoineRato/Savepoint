const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all games
router.get('/', (req, res) => {
  const games = db.prepare('SELECT * FROM games ORDER BY created_at DESC').all();
  res.json(games);
});

// GET single game
router.get('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });
  res.json(game);
});

// POST new game
router.post('/', (req, res) => {
  const { title, genre, status, rating, hours_played, date_started, date_finished, notes, cover_url, steam_app_id, rawg_id } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });

  const duplicate = rawg_id
    ? db.prepare('SELECT id FROM games WHERE rawg_id = ?').get(rawg_id)
    : db.prepare('SELECT id FROM games WHERE LOWER(title) = LOWER(?)').get(title);
  if (duplicate) return res.status(409).json({ error: `"${title}" is already in your list.` });

  const result = db.prepare(`
    INSERT INTO games (title, genre, status, rating, hours_played, date_started, date_finished, notes, cover_url, steam_app_id, rawg_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, genre || null, status || 'backlog', rating || null, hours_played || null, date_started || null, date_finished || null, notes || null, cover_url || null, steam_app_id || null, rawg_id || null);

  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(game);
});

// PUT update game
router.put('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  const { title, genre, status, rating, hours_played, date_started, date_finished, notes, cover_url, steam_app_id, rawg_id } = req.body;

  db.prepare(`
    UPDATE games SET
      title = ?, genre = ?, status = ?, rating = ?, hours_played = ?,
      date_started = ?, date_finished = ?, notes = ?, cover_url = ?,
      steam_app_id = ?, rawg_id = ?
    WHERE id = ?
  `).run(
    title ?? game.title,
    genre !== undefined ? (genre || null) : game.genre,
    status ?? game.status,
    rating !== undefined ? (rating || null) : game.rating,
    hours_played !== undefined ? (hours_played || null) : game.hours_played,
    date_started !== undefined ? (date_started || null) : game.date_started,
    date_finished !== undefined ? (date_finished || null) : game.date_finished,
    notes !== undefined ? (notes || null) : game.notes,
    cover_url !== undefined ? (cover_url || null) : game.cover_url,
    steam_app_id !== undefined ? (steam_app_id || null) : game.steam_app_id,
    rawg_id !== undefined ? (rawg_id || null) : game.rawg_id,
    req.params.id
  );

  res.json(db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id));
});

// DELETE game
router.delete('/:id', (req, res) => {
  const game = db.prepare('SELECT * FROM games WHERE id = ?').get(req.params.id);
  if (!game) return res.status(404).json({ error: 'Game not found' });

  db.prepare('DELETE FROM games WHERE id = ?').run(req.params.id);
  res.status(204).send();
});

module.exports = router;
