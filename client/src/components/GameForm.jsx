import { useState } from 'react';

const STATUSES = ['backlog', 'playing', 'completed', 'dropped'];

export default function GameForm({ initial = {}, onSubmit, submitLabel = 'Save', hideTitle = false }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    genre: initial.genre ?? '',
    status: initial.status ?? 'backlog',
    rating: initial.rating ?? '',
    hours_played: initial.hours_played ?? '',
    date_started: initial.date_started ?? '',
    date_finished: initial.date_finished ?? '',
    notes: initial.notes ?? '',
    cover_url: initial.cover_url ?? '',
    steam_app_id: initial.steam_app_id ?? '',
    rawg_id: initial.rawg_id ?? '',
  });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title,
      genre: form.genre || null,
      status: form.status,
      rating: form.rating !== '' ? Number(form.rating) : null,
      hours_played: form.hours_played !== '' ? Number(form.hours_played) : null,
      date_started: form.date_started || null,
      date_finished: form.date_finished || null,
      notes: form.notes || null,
      cover_url: form.cover_url || null,
      steam_app_id: form.steam_app_id !== '' ? Number(form.steam_app_id) : null,
      rawg_id: form.rawg_id !== '' ? Number(form.rawg_id) : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 480 }}>
      {!hideTitle && (
        <Field label="Title *">
          <input required value={form.title} onChange={set('title')} />
        </Field>
      )}
      <Field label="Genre">
        <input value={form.genre} onChange={set('genre')} />
      </Field>
      <Field label="Status">
        <select value={form.status} onChange={set('status')}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
      </Field>
      <Field label="Rating (1–10)">
        <input type="number" min="1" max="10" value={form.rating} onChange={set('rating')} />
      </Field>
      <Field label="Hours Played">
        <input type="number" min="0" step="0.1" value={form.hours_played} onChange={set('hours_played')} />
      </Field>
      <Field label="Date Started">
        <input type="date" value={form.date_started} onChange={set('date_started')} />
      </Field>
      <Field label="Date Finished">
        <input type="date" value={form.date_finished} onChange={set('date_finished')} />
      </Field>
      <Field label="Cover URL">
        <input value={form.cover_url} onChange={set('cover_url')} />
      </Field>
      <Field label="Notes">
        <textarea rows={3} value={form.notes} onChange={set('notes')} />
      </Field>
      <Field label="Steam App ID">
        <input type="number" value={form.steam_app_id} onChange={set('steam_app_id')} />
      </Field>
      <button type="submit" style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>
        {submitLabel}
      </button>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.9rem', fontWeight: 500 }}>
      {label}
      {children}
    </label>
  );
}
