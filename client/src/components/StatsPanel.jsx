import styles from './StatsPanel.module.css';

const STATUSES = [
  { value: 'playing', label: 'Playing', icon: '▶', cssClass: 'pillPlaying' },
  { value: 'completed', label: 'Completed', icon: '✓', cssClass: 'pillCompleted' },
  { value: 'backlog', label: 'Backlog', icon: '○', cssClass: 'pillBacklog' },
  { value: 'dropped', label: 'Dropped', icon: '✕', cssClass: 'pillDropped' },
];

export default function StatsPanel({ stats, activeStatuses, onToggle }) {
  if (!stats) return null;

  return (
    <div className={styles.wrap}>
      {STATUSES.map(s => {
        const count = stats.by_status?.[s.value] || 0;
        const isActive = activeStatuses?.has(s.value);
        return (
          <button
            key={s.value}
            className={`${styles.pill} ${styles[s.cssClass]} ${isActive ? styles.active : styles.inactive}`}
            onClick={() => onToggle?.(s.value)}
          >
            {s.icon} {count} {s.label}
          </button>
        );
      })}
      <div className={styles.metrics}>
        {stats.avg_rating != null && <span>Moy. {stats.avg_rating}</span>}
        {stats.avg_rating != null && stats.total_hours != null && ' · '}
        {stats.total_hours != null && <span>{stats.total_hours}h</span>}
      </div>
    </div>
  );
}
