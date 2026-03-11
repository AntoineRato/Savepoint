import { useState, useEffect } from 'react';

export default function GameDetailSheet({ game, isOpen, onClose, onEdit, onDelete }) {
  const [tab, setTab] = useState(0);
  const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

  useEffect(() => {
    setTab(0);
  }, [game?.id]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen || !game) return null;

  const sheetStyle = isMobile
    ? { position: 'fixed', bottom: 0, left: 0, right: 0, height: '90vh', borderRadius: '16px 16px 0 0', background: '#fff', overflowY: 'auto', padding: 24 }
    : { background: '#fff', borderRadius: 12, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', padding: 24 };

  const statusColors = { backlog: '#6b7280', playing: '#2563eb', completed: '#16a34a', dropped: '#dc2626' };

  return (
    <div
      onClick={onClose}
      role="presentation"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={game.title}
        style={sheetStyle}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', paddingRight: 16 }}>{game.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['Infos', 'Affiches & Tags'].map((label, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb',
                       background: tab === i ? '#2563eb' : '#fff',
                       color: tab === i ? '#fff' : '#374151', cursor: 'pointer' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tab 0 — Infos */}
        {tab === 0 && (
          <div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
              {game.cover_url && (
                <img src={game.cover_url} alt={game.title}
                  style={{ width: 120, height: 160, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} />
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem',
                                 background: statusColors[game.status] || '#6b7280', color: '#fff' }}>
                    {game.status}
                  </span>
                </div>
                {game.rating && <div style={{ fontSize: '0.9rem', color: '#374151' }}>Ma note : <strong>{game.rating}/100</strong></div>}
                {game.hours_played && <div style={{ fontSize: '0.9rem', color: '#374151' }}>Heures : <strong>{game.hours_played}h</strong></div>}
                {(game.genres || []).length > 0 && (
                  <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{game.genres.join(', ')}</div>
                )}
                {game.release_date && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Sortie : {game.release_date}</div>}
                {game.developer && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Dev : {game.developer}</div>}
                {game.publisher && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>Éditeur : {game.publisher}</div>}
                {game.metascore && <div style={{ fontSize: '0.85rem', color: '#374151' }}>Metascore : <strong>{game.metascore}</strong></div>}
              </div>
            </div>

            {game.date_started && <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Commencé : {game.date_started}</div>}
            {game.date_finished && <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: 4 }}>Terminé : {game.date_finished}</div>}
            {game.notes && (
              <div style={{ marginTop: 12, padding: 12, background: '#f9fafb', borderRadius: 6, fontSize: '0.9rem', color: '#374151' }}>
                {game.notes}
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {game.rawg_id && (
                <a href={`https://rawg.io/games/${game.rawg_id}`} target="_blank" rel="noreferrer"
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#374151', textDecoration: 'none' }}>
                  Voir sur RAWG
                </a>
              )}
              {game.steam_app_id && (
                <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noreferrer"
                  style={{ padding: '5px 12px', borderRadius: 6, border: '1px solid #e5e7eb', fontSize: '0.85rem', color: '#374151', textDecoration: 'none' }}>
                  Voir sur Steam
                </a>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => onEdit(game)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>
                Modifier
              </button>
              <button onClick={() => onDelete(game.id)}
                style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #fca5a5', background: '#fff', color: '#dc2626', cursor: 'pointer', fontSize: '0.9rem' }}>
                Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Tab 1 — Affiches & Tags */}
        {tab === 1 && (
          <div>
            {(game.screenshots || []).length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
                {game.screenshots.map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: '100%', borderRadius: 6 }} />
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>Aucune capture disponible.</p>
            )}
            <div style={{ marginTop: 16, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {(game.tags || []).map(tag => (
                <span key={tag} style={{ background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: '0.8rem', color: '#374151' }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
