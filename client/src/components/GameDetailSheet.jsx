import { useEffect, useRef, useId } from 'react';
import StatusBadge from './StatusBadge';
import styles from './GameDetailSheet.module.css';

export default function GameDetailSheet({ game, isOpen, onClose, onEdit, onDelete }) {
  const sheetRef = useRef(null);
  const titleId = useId();

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;
    const sheet = sheetRef.current;
    const focusable = sheet.querySelectorAll('a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first.focus();

    const trap = (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus(); }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    sheet.addEventListener('keydown', trap);
    return () => sheet.removeEventListener('keydown', trap);
  }, [isOpen, game?.id]);

  if (!isOpen || !game) return null;

  const fallbackInitials = game.title ? game.title.slice(0, 2).toUpperCase() : '??';
  const genreText = (game.genres || []).join(', ');

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={sheetRef}
        className={styles.sheet}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {/* Header */}
        <div className={styles.header}>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Fermer">×</button>
          <button className={styles.editBtn} onClick={() => onEdit(game)}>Modifier</button>
        </div>

        {/* Layout: cover + info */}
        <div className={styles.layout}>
          <div className={styles.coverCol}>
            {game.cover_url ? (
              <img className={styles.coverImg} src={game.cover_url} alt={game.title} />
            ) : (
              <div className={styles.coverFallback}>{fallbackInitials}</div>
            )}
          </div>
          <div className={styles.infoCol}>
            <h2 id={titleId} className={styles.title}>{game.title}</h2>
            <div className={styles.metaRow}>
              <StatusBadge status={game.status} />
              {game.rating != null && <span>★ {game.rating}</span>}
              {game.hours_played != null && <span>{game.hours_played}h</span>}
            </div>
            {genreText && <div className={styles.genres}>{genreText}</div>}

            {(game.date_started || game.date_finished) && (
              <div className={styles.dates}>
                {game.date_started && (
                  <div>
                    <span className={styles.dateLabel}>Commencé</span>
                    <span className={styles.dateValue}>{formatDate(game.date_started)}</span>
                  </div>
                )}
                {game.date_finished && (
                  <div>
                    <span className={styles.dateLabel}>Terminé</span>
                    <span className={styles.dateValue}>{formatDate(game.date_finished)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {game.notes && <div className={styles.notes}>{game.notes}</div>}

        {/* Footer */}
        <div className={styles.footer}>
          {game.rawg_id && (
            <a href={`https://rawg.io/games/${game.rawg_id}`} target="_blank" rel="noreferrer" className={styles.linkBtn}>
              Voir sur RAWG
            </a>
          )}
          {game.steam_app_id && (
            <a href={`https://store.steampowered.com/app/${game.steam_app_id}`} target="_blank" rel="noreferrer" className={styles.linkBtn}>
              Voir sur Steam
            </a>
          )}
          <button className={styles.deleteBtn} onClick={() => onDelete(game.id)}>Supprimer</button>
        </div>
      </div>
    </div>
  );
}
