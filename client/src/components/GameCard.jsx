import { Link } from 'react-router-dom';
import StatusBadge from './StatusBadge';

export default function GameCard({ game, onDelete }) {
  const handleDelete = () => {
    if (window.confirm(`Delete "${game.title}"?`)) {
      onDelete(game.id);
    }
  };

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <img
        src={game.cover_url || ''}
        alt={game.title}
        onError={(e) => { e.target.style.display = 'none'; }}
        style={{ width: '100%', height: 160, objectFit: 'cover', backgroundColor: '#f3f4f6' }}
      />
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>{game.title}</div>
        {game.genre && <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>{game.genre}</div>}
        <div style={{ marginTop: 4 }}>
          <StatusBadge status={game.status} />
        </div>
        <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: 4 }}>
          {game.rating != null && <span>★ {game.rating}/10 · </span>}
          {game.hours_played != null && <span>{game.hours_played}h</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
          <Link to={`/edit/${game.id}`} style={{ fontSize: '0.85rem', color: '#2563eb' }}>Edit</Link>
          <button onClick={handleDelete} style={{ fontSize: '0.85rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
