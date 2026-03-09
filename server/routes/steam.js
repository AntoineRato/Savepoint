const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');
const db = require('../db');

router.post('/sync', async (req, res) => {
  const steamIdRow = db.prepare("SELECT value FROM settings WHERE key = 'steam_id'").get();
  const steamKeyRow = db.prepare("SELECT value FROM settings WHERE key = 'steam_key'").get();

  if (!steamIdRow?.value || !steamKeyRow?.value) {
    return res.status(400).json({ error: 'Steam ID and Steam API key must be configured in Settings.' });
  }

  let steamId = steamIdRow.value.trim();
  const steamKey = steamKeyRow.value.trim();

  try {
    // If not a 64-bit SteamID, try to resolve as a vanity URL
    if (!/^\d{17}$/.test(steamId)) {
      const resolveUrl = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${steamKey}&vanityurl=${encodeURIComponent(steamId)}`;
      const resolveRes = await fetch(resolveUrl);
      const resolveData = await resolveRes.json();
      if (resolveData?.response?.success === 1) {
        steamId = resolveData.response.steamid;
      } else {
        return res.status(400).json({ error: `Could not resolve "${steamId}" to a Steam account. Check your Steam ID in Settings.` });
      }
    }

    const url = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${steamKey}&steamid=${steamId}&include_appinfo=true&format=json`;
    const response = await fetch(url);
    if (!response.ok) {
      let hint = '';
      if (response.status === 400) hint = ' — Check that your Steam ID is a 64-bit SteamID (e.g. 76561198XXXXXXXXX), not a username or vanity URL.';
      if (response.status === 403) hint = ' — Your Steam API key may be invalid or unauthorized.';
      return res.status(502).json({ error: `Steam API returned ${response.status}${hint}` });
    }

    const data = await response.json();

    if (!data.response || !data.response.games) {
      return res.status(400).json({ error: 'Steam profile is private or no games found.' });
    }

    const steamGames = data.response.games;
    const allLocalGames = db.prepare('SELECT id, title, steam_app_id, hours_played FROM games').all();

    const steamMap = new Map(steamGames.map((g) => [g.appid, g]));
    const steamByName = new Map(steamGames.map((g) => [g.name.toLowerCase(), g]));

    const update = db.prepare('UPDATE games SET hours_played = ? WHERE id = ?');
    const updateWithAppId = db.prepare('UPDATE games SET hours_played = ?, steam_app_id = ? WHERE id = ?');

    const syncAll = db.transaction(() => {
      let updated = 0;
      for (const local of allLocalGames) {
        let steamGame = local.steam_app_id ? steamMap.get(local.steam_app_id) : null;

        // Fallback: match by title for games without a steam_app_id
        if (!steamGame && !local.steam_app_id) {
          const localTitle = local.title.toLowerCase();
          steamGame = steamByName.get(localTitle)
            ?? steamGames.find((g) => {
                const s = g.name.toLowerCase();
                return s.includes(localTitle) || localTitle.includes(s);
              })
            ?? null;
          if (steamGame) {
            const hours = Math.round((steamGame.playtime_forever / 60) * 10) / 10;
            updateWithAppId.run(hours, steamGame.appid, local.id);
            updated++;
            continue;
          }
        }

        if (steamGame) {
          const hours = Math.round((steamGame.playtime_forever / 60) * 10) / 10;
          update.run(hours, local.id);
          updated++;
        }
      }
      return updated;
    });

    const updated = syncAll();
    res.json({ message: `Synced ${updated} game(s) from Steam.`, updated });
  } catch (err) {
    res.status(502).json({ error: 'Failed to reach Steam API' });
  }
});

module.exports = router;
