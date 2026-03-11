const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../db');

router.get('/detail/:id', async (req, res) => {
  const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'rawg_key'").get();
  if (!keyRow?.value) return res.status(400).json({ error: 'RAWG API key not configured.' });

  try {
    const key = keyRow.value;
    const id = req.params.id;

    const [detail, stores, screens] = await Promise.all([
      fetch(`https://api.rawg.io/api/games/${id}?key=${key}`).then(r => r.json()),
      fetch(`https://api.rawg.io/api/games/${id}/stores?key=${key}`).then(r => r.json()),
      fetch(`https://api.rawg.io/api/games/${id}/screenshots?key=${key}&page_size=6`).then(r => r.json()),
    ]);

    let steam_app_id = null;
    for (const s of stores.results || []) {
      const match = s.url?.match(/store\.steampowered\.com\/app\/(\d+)/);
      if (match) { steam_app_id = parseInt(match[1], 10); break; }
    }

    res.json({
      steam_app_id,
      genres:       (detail.genres || []).map(g => g.name),
      tags:         (detail.tags || []).slice(0, 20).map(t => t.name),
      release_date: detail.released ?? null,
      developer:    detail.developers?.[0]?.name ?? null,
      publisher:    detail.publishers?.[0]?.name ?? null,
      metascore:    detail.metacritic ?? null,
      screenshots:  (screens.results || []).map(s => s.image),
    });
  } catch {
    res.status(502).json({ error: 'Failed to reach RAWG API' });
  }
});

router.get('/', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length === 0) return res.json([]);

  const keyRow = db.prepare("SELECT value FROM settings WHERE key = 'rawg_key'").get();
  if (!keyRow || !keyRow.value) {
    return res.status(400).json({ error: 'RAWG API key not configured. Add it in Settings.' });
  }

  try {
    const url = `https://api.rawg.io/api/games?key=${keyRow.value}&search=${encodeURIComponent(q)}&page_size=10`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: `RAWG returned ${response.status}` });
    }
    const data = await response.json();
    const results = (data.results || []).map((g) => ({
      id: g.id,
      name: g.name,
      genre: g.genres?.[0]?.name ?? null,
      cover_url: g.background_image ?? null,
      rating: g.rating ? Math.min(100, Math.max(1, Math.round(g.rating * 20))) : null,
    }));
    res.json(results);
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach RAWG API' });
  }
});

module.exports = router;
