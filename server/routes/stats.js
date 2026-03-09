const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const statusCounts = db.prepare(`
    SELECT status, COUNT(*) as count FROM games GROUP BY status
  `).all();

  const counts = { backlog: 0, playing: 0, completed: 0, dropped: 0 };
  for (const row of statusCounts) {
    counts[row.status] = row.count;
  }

  const { avg_rating } = db.prepare(`
    SELECT ROUND(AVG(rating), 1) as avg_rating FROM games WHERE rating IS NOT NULL
  `).get();

  const { total_hours } = db.prepare(`
    SELECT ROUND(SUM(hours_played), 1) as total_hours FROM games WHERE hours_played IS NOT NULL
  `).get();

  const { completed_this_year } = db.prepare(`
    SELECT COUNT(*) as completed_this_year FROM games
    WHERE status = 'completed' AND strftime('%Y', date_finished) = strftime('%Y', 'now')
  `).get();

  const { completed_this_month } = db.prepare(`
    SELECT COUNT(*) as completed_this_month FROM games
    WHERE status = 'completed'
      AND strftime('%Y-%m', date_finished) = strftime('%Y-%m', 'now')
  `).get();

  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  res.json({
    total,
    by_status: counts,
    avg_rating: avg_rating ?? null,
    total_hours: total_hours ?? null,
    completed_this_year,
    completed_this_month,
  });
});

module.exports = router;
