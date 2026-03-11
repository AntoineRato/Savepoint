import styles from './StatusBadge.module.css';

const labels = {
  backlog: 'Backlog',
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
};

export default function StatusBadge({ status }) {
  return (
    <span className={`${styles.badge} ${styles[status] || ''}`}>
      {labels[status] || status}
    </span>
  );
}
