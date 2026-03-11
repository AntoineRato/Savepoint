import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { getGames, getStats, deleteGame, syncSteam, refreshMetadata } from '../api/client';
import StatsPanel from '../components/StatsPanel';
import GameCard from '../components/GameCard';
import GameDetailSheet from '../components/GameDetailSheet';

const ALL_STATUSES = ['backlog', 'playing', 'completed', 'dropped'];

export default function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [backlogBtnText, setBacklogBtnText] = useState('Backlog Smart');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatuses, setActiveStatuses] = useState(new Set(ALL_STATUSES));
  const [activeGenres, setActiveGenres] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const reloadGames = async () => {
    const [g, s] = await Promise.all([getGames(), getStats()]);
    setGames(g);
    setStats(s);
  };

  useEffect(() => {
    const load = async () => {
      await syncSteam().catch(() => {});
      await reloadGames().catch((err) => setError(err.message));
      refreshMetadata().catch(() => {}).then(() => reloadGames().catch(() => {}));
    };
    load();
  }, []);

  useEffect(() => {
    const onFocus = () => refreshMetadata().catch(() => {}).then(() => reloadGames().catch(() => {}));
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refreshMetadata().catch(() => {}).then(() => reloadGames().catch(() => {}));
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const handleDelete = async (id) => {
    if (selectedGame?.id === id) setSelectedGame(null);
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

  const toggleStatus = (status) => {
    setActiveStatuses(prev => {
      const next = new Set(prev);
      next.has(status) ? next.delete(status) : next.add(status);
      return next;
    });
  };

  const toggleGenre = (genre) => {
    setActiveGenres(prev => {
      const next = new Set(prev);
      next.has(genre) ? next.delete(genre) : next.add(genre);
      return next;
    });
  };

  const buildPrompt = () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthsAgo = (dateStr) => {
      if (!dateStr) return '?';
      return Math.round((Date.now() - new Date(dateStr)) / (1000 * 60 * 60 * 24 * 30));
    };

    const recent = games.filter(g => g.status === 'completed' && g.date_finished && new Date(g.date_finished) >= sixMonthsAgo);
    const playing = games.filter(g => g.status === 'playing');
    const dropped = games.filter(g => g.status === 'dropped');
    const backlog = games
      .filter(g => g.status === 'backlog')
      .sort((a, b) => (b.metascore ?? 0) - (a.metascore ?? 0) || new Date(a.created_at) - new Date(b.created_at));

    const ratings = games.filter(g => g.rating != null).map(g => g.rating);
    const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 'N/A';
    const totalHours = games.reduce((sum, g) => sum + (g.hours_played || 0), 0).toFixed(0);

    const genreCount = {};
    games.forEach(g => (g.genres || []).forEach(genre => { genreCount[genre] = (genreCount[genre] || 0) + 1; }));
    const topGenres = Object.entries(genreCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([g]) => g);

    return `Je gère ma bibliothèque de jeux vidéo. Voici mes données :

Jeux récemment terminés (6 derniers mois) : ${recent.map(g => `${g.title} (${(g.genres||[]).join(', ')}, ${g.hours_played ?? '?'}h, noté ${g.rating}/100)`).join(', ') || 'aucun'}
En cours : ${playing.map(g => `${g.title} (${(g.genres||[]).join(', ')}, ${g.hours_played ?? '?'}h)`).join(', ') || 'aucun'}
Dropped : ${dropped.map(g => `${g.title} (${(g.genres||[]).join(', ')})`).join(', ') || 'aucun'}

Backlog (${backlog.length} jeux) :
${backlog.map(g => `- ${g.title} | Genres: ${(g.genres||[]).join(', ')} | Metascore: ${g.metascore ?? 'N/A'} | Ajouté il y a ${monthsAgo(g.created_at)} mois`).join('\n')}

Mes stats : note moyenne donnée ${avgRating}/10 | total heures jouées ${totalHours}h | genres les plus joués : ${topGenres.join(', ')}

Recommande-moi mon prochain jeu.`;
  };

  const handleBacklogSmart = async () => {
    const prompt = buildPrompt();
    try {
      await navigator.clipboard.writeText(prompt);
      setBacklogBtnText('Copié !');
    } catch {
      setFallbackPrompt(prompt);
    }
    setTimeout(() => setBacklogBtnText('Backlog Smart'), 2000);
  };

  const getGameGenres = (g) => g.genres?.length > 0 ? g.genres : (g.genre ? [g.genre] : []);

  const availableGenres = useMemo(() =>
    [...new Set(games.flatMap(getGameGenres))].sort()
  , [games]);

  const filteredGames = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return games
      .filter(g => !q || g.title.toLowerCase().includes(q)
                 || getGameGenres(g).some(x => x.toLowerCase().includes(q))
                 || (g.tags || []).some(x => x.toLowerCase().includes(q)))
      .filter(g => activeStatuses.has(g.status))
      .filter(g => activeGenres.size === 0 || getGameGenres(g).some(x => activeGenres.has(x)));
  }, [games, searchQuery, activeStatuses, activeGenres]);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>My Games</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleBacklogSmart} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', cursor: 'pointer' }}>
            {backlogBtnText}
          </button>
          <button onClick={handleSteamSync} disabled={syncing} style={{ padding: '6px 14px', borderRadius: 6, cursor: 'pointer' }}>
            {syncing ? 'Syncing…' : 'Sync Steam'}
          </button>
          <Link to="/add" style={{ padding: '6px 14px', background: '#2563eb', color: '#fff', borderRadius: 6, textDecoration: 'none', fontWeight: 600 }}>
            + Add Game
          </Link>
        </div>
      </div>

      {/* Search + Filters bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Search games, genres, tags…"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '6px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.9rem' }}
        />
        <button
          onClick={() => setShowFilters(p => !p)}
          style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: showFilters ? '#2563eb' : '#fff', color: showFilters ? '#fff' : '#374151', cursor: 'pointer' }}
        >
          Filtres {showFilters ? '▲' : '▼'}
        </button>
      </div>

      {showFilters && (
        <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <div style={{ marginBottom: 10 }}>
            <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Statuts</strong>
            <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
              {ALL_STATUSES.map(s => (
                <button key={s} onClick={() => toggleStatus(s)}
                  style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: '0.8rem',
                           background: activeStatuses.has(s) ? '#2563eb' : '#fff',
                           color: activeStatuses.has(s) ? '#fff' : '#374151', cursor: 'pointer' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {availableGenres.length > 0 && (
            <div>
              <strong style={{ fontSize: '0.85rem', color: '#374151' }}>Genres {activeGenres.size > 0 && `(${activeGenres.size} actif)`}</strong>
              {activeGenres.size > 0 && (
                <button onClick={() => setActiveGenres(new Set())}
                  style={{ marginLeft: 8, fontSize: '0.75rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Réinitialiser
                </button>
              )}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                {availableGenres.map(genre => (
                  <button key={genre} onClick={() => toggleGenre(genre)}
                    style={{ padding: '3px 10px', borderRadius: 4, border: '1px solid #e5e7eb', fontSize: '0.8rem',
                             background: activeGenres.has(genre) ? '#2563eb' : '#fff',
                             color: activeGenres.has(genre) ? '#fff' : '#374151', cursor: 'pointer' }}>
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {fallbackPrompt && (
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Copier ce prompt manuellement :</p>
          <textarea
            readOnly
            value={fallbackPrompt}
            onClick={e => e.target.select()}
            style={{ width: '100%', height: 120, fontSize: '0.8rem', padding: 8, borderRadius: 6, border: '1px solid #e5e7eb', resize: 'vertical', boxSizing: 'border-box' }}
          />
          <button onClick={() => setFallbackPrompt(null)} style={{ fontSize: '0.8rem', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer' }}>Fermer</button>
        </div>
      )}

      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {syncMsg && <div style={{ color: '#16a34a', marginBottom: 12 }}>{syncMsg}</div>}

      <StatsPanel stats={stats} />

      {filteredGames.length === 0 ? (
        <p style={{ color: '#6b7280' }}>
          {games.length === 0 ? <><Link to="/add">Add one!</Link></> : 'Aucun jeu ne correspond aux filtres.'}
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {filteredGames.map((g) => <GameCard key={g.id} game={g} onDelete={handleDelete} onClick={() => setSelectedGame(g)} />)}
        </div>
      )}

      <GameDetailSheet
        game={selectedGame}
        isOpen={!!selectedGame}
        onClose={() => setSelectedGame(null)}
        onEdit={(game) => { setSelectedGame(null); navigate(`/edit/${game.id}`); }}
        onDelete={handleDelete}
      />
    </div>
  );
}
