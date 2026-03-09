export default function StatsPanel({ stats }) {
  if (!stats) return null;
  return (
    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
      <StatBox label="Total" value={stats.total} />
      <StatBox label="Playing" value={stats.by_status.playing} color="#2563eb" />
      <StatBox label="Completed" value={stats.by_status.completed} color="#16a34a" />
      <StatBox label="Backlog" value={stats.by_status.backlog} color="#6b7280" />
      <StatBox label="Dropped" value={stats.by_status.dropped} color="#dc2626" />
      {stats.avg_rating != null && <StatBox label="Avg Rating" value={`${stats.avg_rating}/10`} />}
      {stats.total_hours != null && <StatBox label="Total Hours" value={`${stats.total_hours}h`} />}
      <StatBox label="Completed This Year" value={stats.completed_this_year} />
      <StatBox label="This Month" value={stats.completed_this_month} />
    </div>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', minWidth: 100, textAlign: 'center' }}>
      <div style={{ fontSize: '1.4rem', fontWeight: 700, color: color || '#111827' }}>{value}</div>
      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: 2 }}>{label}</div>
    </div>
  );
}
