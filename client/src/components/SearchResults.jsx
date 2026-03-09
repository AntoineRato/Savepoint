export default function SearchResults({ results, onSelect, activeIndex = -1 }) {
  if (!results || results.length === 0) return null;
  return (
    <ul style={{
      listStyle: 'none', padding: 0, margin: 0,
      position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
      border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)', overflow: 'hidden', maxHeight: 360, overflowY: 'auto',
    }}>
      {results.map((game, i) => (
        <li
          key={game.id}
          onMouseDown={(e) => { e.preventDefault(); onSelect(game); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', cursor: 'pointer',
            borderBottom: '1px solid #f3f4f6',
            background: i === activeIndex ? '#eff6ff' : '',
          }}
          onMouseEnter={(e) => { if (i !== activeIndex) e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={(e) => { if (i !== activeIndex) e.currentTarget.style.background = ''; }}
        >
          {game.cover_url && (
            <img
              src={game.cover_url}
              alt={game.name}
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
          <div>
            <div style={{ fontWeight: 600, color: '#111827' }}>{game.name}</div>
            {game.genre && <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{game.genre}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
