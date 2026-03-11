import StatusBadge from './StatusBadge';
import styles from './GameCard.module.css';

export default function GameCard({ game, onClick, removing }) {
  const genreText = game.genres?.length > 0
    ? game.genres.join(', ')
    : game.genre || null;

  const fallbackInitials = game.title
    ? game.title.slice(0, 2).toUpperCase()
    : '??';

  return (
    <div
      className={`${styles.card} ${removing ? styles.removing : ''}`}
      onClick={onClick}
    >
      <div className={styles.coverWrap}>
        {game.cover_url ? (
          <img className={styles.cover} src={game.cover_url} alt={game.title} />
        ) : (
          <div className={styles.coverFallback}>{fallbackInitials}</div>
        )}
        <div className={styles.statusOverlay}>
          <StatusBadge status={game.status} />
        </div>
      </div>
      <div className={styles.info}>
        <div className={styles.title}>{game.title}</div>
        {genreText && <div className={styles.genres}>{genreText}</div>}
        {(game.rating != null || game.hours_played != null) && (
          <div className={styles.meta}>
            {game.rating != null && <span>★ {game.rating}</span>}
            {game.rating != null && game.hours_played != null && ' · '}
            {game.hours_played != null && <span>{game.hours_played}h</span>}
          </div>
        )}
      </div>
    </div>
  );
}
