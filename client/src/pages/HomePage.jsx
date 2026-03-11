import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getGames, getStats, deleteGame, syncSteam, refreshMetadata } from '../api/client';
import StatsPanel from '../components/StatsPanel';
import GameCard from '../components/GameCard';
import GameDetailSheet from '../components/GameDetailSheet';
import styles from './HomePage.module.css';

const ALL_STATUSES = ['backlog', 'playing', 'completed', 'dropped'];

export default function HomePage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState(null);
  const [removingIds, setRemovingIds] = useState(new Set());
  const [backlogBtnText, setBacklogBtnText] = useState('✦ IA Reco');
  const [fallbackPrompt, setFallbackPrompt] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeStatuses, setActiveStatuses] = useState(new Set(ALL_STATUSES));
  const [activeGenres, setActiveGenres] = useState(new Set());
  const [genreOpen, setGenreOpen] = useState(false);
  const popoverRef = useRef(null);

  const reloadGames = async () => {
    const [g, s] = await Promise.all([getGames(), getStats()]);
    setGames(g);
    setStats(s);
  };

  useEffect(() => {
    const load = async () => {
      try {
        await syncSteam().catch(() => {});
        await reloadGames();
      } catch { /* ignore */ }
      setLoading(false);
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

  // Close genre popover on click outside
  useEffect(() => {
    if (!genreOpen) return;
    const handler = (e) => {
      if (!popoverRef.current?.contains(e.target)) setGenreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [genreOpen]);

  const handleDelete = async (id) => {
    setRemovingIds(s => new Set(s).add(id));
    setTimeout(async () => {
      try {
        await deleteGame(id);
        if (selectedGame?.id === id) setSelectedGame(null);
        setGames(prev => prev.filter(g => g.id !== id));
        setRemovingIds(s => { const n = new Set(s); n.delete(id); return n; });
        const st = await getStats();
        setStats(st);
      } catch { /* ignore */ }
    }, 200);
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

  const resetFilters = () => {
    setSearchQuery('');
    setActiveStatuses(new Set(ALL_STATUSES));
    setActiveGenres(new Set());
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
    setTimeout(() => setBacklogBtnText('✦ IA Reco'), 2000);
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
      {/* Toolbar: search + genre + reco */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Rechercher jeux, genres, tags…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className={styles.genreWrap} ref={popoverRef}>
          <button
            className={`${styles.genreBtn} ${activeGenres.size > 0 ? styles.genreBtnActive : ''}`}
            onClick={() => setGenreOpen(p => !p)}
          >
            Genres {activeGenres.size > 0 ? `(${activeGenres.size})` : '▼'}
          </button>
          {genreOpen && (
            <div className={styles.genrePopover}>
              {availableGenres.map(genre => (
                <label key={genre} className={styles.genreItem}>
                  <input
                    type="checkbox"
                    checked={activeGenres.has(genre)}
                    onChange={() => toggleGenre(genre)}
                  />
                  {genre}
                </label>
              ))}
              {activeGenres.size > 0 && (
                <button className={styles.genreReset} onClick={() => setActiveGenres(new Set())}>
                  Réinitialiser
                </button>
              )}
            </div>
          )}
        </div>

        <button className={styles.recoBtn} onClick={handleBacklogSmart}>
          {backlogBtnText}
          <span className={styles.recoTooltip}>Copier un prompt IA de recommandation</span>
        </button>
      </div>

      {/* Fallback prompt textarea */}
      {fallbackPrompt && (
        <div className={styles.fallbackPrompt}>
          <p>Copier ce prompt manuellement :</p>
          <textarea readOnly value={fallbackPrompt} onClick={e => e.target.select()} />
          <button onClick={() => setFallbackPrompt(null)}>Fermer</button>
        </div>
      )}

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatsPanel stats={stats} activeStatuses={activeStatuses} onToggle={toggleStatus} />
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.grid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      ) : filteredGames.length === 0 ? (
        games.length === 0 ? (
          <div className={styles.emptyState}>
            <span>🎮</span>
            <p>Bibliothèque vide</p>
            <small>Ajoutez votre premier jeu pour commencer.</small>
            <Link to="/add">+ Ajouter un jeu</Link>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>Aucun jeu ne correspond.</p>
            <button onClick={resetFilters}>Réinitialiser les filtres</button>
          </div>
        )
      ) : (
        <div className={styles.grid}>
          {filteredGames.map(g => (
            <GameCard
              key={g.id}
              game={g}
              onClick={() => setSelectedGame(g)}
              removing={removingIds.has(g.id)}
            />
          ))}
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
