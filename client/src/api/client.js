const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

// Games
export const getGames = () => request('/games');
export const getGame = (id) => request(`/games/${id}`);
export const createGame = (body) => request('/games', { method: 'POST', body: JSON.stringify(body) });
export const updateGame = (id, body) => request(`/games/${id}`, { method: 'PUT', body: JSON.stringify(body) });
export const deleteGame = (id) => request(`/games/${id}`, { method: 'DELETE' });

// Stats
export const getStats = () => request('/stats');

// Settings
export const getSettings = () => request('/settings');
export const saveSettings = (body) => request('/settings', { method: 'PUT', body: JSON.stringify(body) });

// Search
export const searchGames = (q) => request(`/search?q=${encodeURIComponent(q)}`);
export const getGameDetail = (rawgId) => request(`/search/detail/${rawgId}`);

// Steam
export const syncSteam = () => request('/steam/sync', { method: 'POST' });
