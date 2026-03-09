import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchGames, createGame, getGameDetail, syncSteam } from '../api/client';
import SearchResults from '../components/SearchResults';
import GameForm from '../components/GameForm';

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
    } catch {
      // best-effort
    }

    setSelected(base);
    setLoadingDetail(false);
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
      syncSteam().catch(() => {}); // best-effort, don't block navigation
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Add Game</h1>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}

      <div style={{ marginBottom: 20, maxWidth: 480 }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontWeight: 500 }}>
          Search RAWG
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              onFocus={() => results.length > 0 && setOpen(true)}
              onBlur={() => setTimeout(() => setOpen(false), 100)}
              placeholder="Search for a game…"
              style={{ width: '100%', boxSizing: 'border-box' }}
              autoComplete="off"
            />
            {open && (
              <SearchResults results={results} onSelect={handleSelect} activeIndex={activeIndex} />
            )}
          </div>
        </label>
      </div>

      {loadingDetail && <div style={{ color: '#6b7280', marginBottom: 12 }}>Fetching game details…</div>}

      {selected && !loadingDetail && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          {selected.cover_url && (
            <img src={selected.cover_url} alt={selected.title} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', color: '#111827' }}>{selected.title}</div>
            {selected.genre && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{selected.genre}</div>}
          </div>
        </div>
      )}
      {!loadingDetail && <GameForm key={selected?.rawg_id ?? 'empty'} initial={selected || {}} onSubmit={handleSubmit} submitLabel="Add Game" hideTitle={!!selected} />}
    </div>
  );
}
