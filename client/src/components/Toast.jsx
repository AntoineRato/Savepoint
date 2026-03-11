import styles from './Toast.module.css';

export default function Toast({ toasts }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className={styles.container}>
      {toasts.map(t => (
        <div key={t.id} className={`${styles.toast} ${styles[t.type] || styles.success}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}
