const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all settings as a plain object
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

// PUT upsert one or more settings
router.put('/', (req, res) => {
  const upsert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const upsertMany = db.transaction((entries) => {
    for (const [key, value] of entries) {
      upsert.run(key, value);
    }
  });

  upsertMany(Object.entries(req.body));

  const rows = db.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of rows) {
    settings[row.key] = row.value;
  }
  res.json(settings);
});

module.exports = router;
