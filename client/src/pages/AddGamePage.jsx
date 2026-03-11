import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGames, createGame, getGameDetail, syncSteam } from '../api/client';
import SearchResults from '../components/SearchResults';
import GameForm from '../components/GameForm';
import styles from './AddGamePage.module.css';

export default function AddGamePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const debounceRef = useRef(null);

  const handleQueryChange = (e) => {
    const q = e.target.value;
    setQuery(q);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await searchGames(q);
        setResults(data);
        setOpen(data.length > 0);
      } catch (err) {
        setError(err.message);
      }
    }, 400);
  };

  const handleSelect = async (game) => {
    setQuery(game.name);
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
    setLoadingDetail(true);

    const base = {
      title: game.name,
      genre: game.genre,
      cover_url: game.cover_url,
      rawg_id: game.id,
      rating: game.rating ?? '',
    };

    try {
      const detail = await getGameDetail(game.id);
      if (detail?.steam_app_id) base.steam_app_id = detail.steam_app_id;
      if (detail?.genres?.length)    base.genres       = detail.genres;
      if (detail?.tags?.length)      base.tags         = detail.tags;
      if (detail?.release_date)      base.release_date = detail.release_date;
      if (detail?.developer)         base.developer    = detail.developer;
      if (detail?.publisher)         base.publisher    = detail.publisher;
      if (detail?.metascore != null) base.metascore    = detail.metascore;
      if (detail?.screenshots?.length) base.screenshots = detail.screenshots;
    } catch { /* best-effort */ }

    setSelected(base);
    setLoadingDetail(false);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleSubmit = async (data) => {
    try {
      await createGame(data);
      syncSteam().catch(() => {});
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Ajouter un jeu</h1>
      {error && <div className={styles.error}>{error}</div>}

      <label className={styles.searchLabel}>
        Rechercher sur RAWG
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            className={styles.searchInput}
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            onFocus={() => results.length > 0 && setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 100)}
            placeholder="Rechercher un jeu…"
            autoComplete="off"
          />
          {open && (
            <SearchResults results={results} onSelect={handleSelect} activeIndex={activeIndex} />
          )}
        </div>
      </label>

      {loadingDetail && <div className={styles.loadingMsg}>Chargement des détails…</div>}

      {selected && !loadingDetail && (
        <div className={styles.selectedGame}>
          {selected.cover_url && (
            <img className={styles.selectedThumb} src={selected.cover_url} alt={selected.title} />
          )}
          <span className={styles.selectedTitle}>{selected.title}</span>
          <button className={styles.clearBtn} onClick={handleClear} aria-label="Désélectionner">×</button>
        </div>
      )}

      {!loadingDetail && (
        <GameForm
          key={selected?.rawg_id ?? 'empty'}
          initial={selected || {}}
          onSubmit={handleSubmit}
          submitLabel="Ajouter"
          hideTitle={!!selected}
        />
      )}
    </div>
  );
}
