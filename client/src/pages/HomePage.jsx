import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGames, getStats, deleteGame, syncSteam } from '../api/client';
import StatsPanel from '../components/StatsPanel';
import GameCard from '../components/GameCard';

export default function HomePage() {
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);

  useEffect(() => {
    const load = async () => {
      await syncSteam().catch(() => {}); // best-effort, don't block on failure
      Promise.all([getGames(), getStats()])
        .then(([g, s]) => { setGames(g); setStats(s); })
        .catch((err) => setError(err.message));
    };
    load();
  }, []);

  const handleDelete = async (id) => {
    setGames((prev) => prev.filter((g) => g.id !== id));
    try {
      await deleteGame(id);
      const s = await getStats();
      setStats(s);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSteamSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await syncSteam();
      setSyncMsg(result.message);
      const [g, s] = await Promise.all([getGames(), getStats()]);
      setGames(g);
      setStats(s);
    } catch (err) {
      setSyncMsg(`Error: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>My Games</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleSteamSync} disabled={syncing} style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>
            {syncing ? 'Syncing…' : 'Sync Steam'}
          </button>
          <Link to="/add" style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
            + Add Game
          </Link>
        </div>
      </div>

      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {syncMsg && <div style={{ color: '#16a34a', marginBottom: 12 }}>{syncMsg}</div>}

      <StatsPanel stats={stats} />

      {games.length === 0 ? (
        <p style={{ color: '#6b7280' }}>No games yet. <Link to="/add">Add one!</Link></p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {games.map((g) => <GameCard key={g.id} game={g} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
