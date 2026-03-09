const colors = {
  backlog: '#6b7280',
  playing: '#2563eb',
  completed: '#16a34a',
  dropped: '#dc2626',
};

const labels = {
  backlog: 'Backlog',
  playing: 'Playing',
  completed: 'Completed',
  dropped: 'Dropped',
};

export default function StatusBadge({ status }) {
  return (
    <span
      style={{
        backgroundColor: colors[status] || '#6b7280',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontWeight: 600,
      }}
    >
      {labels[status] || status}
    </span>
  );
}
