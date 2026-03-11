import { useState } from 'react';
import styles from './GameForm.module.css';

const STATUSES = [
  { value: 'playing', label: 'Playing' },
  { value: 'completed', label: 'Completed' },
  { value: 'backlog', label: 'Backlog' },
  { value: 'dropped', label: 'Dropped' },
];

export default function GameForm({ initial = {}, onSubmit, submitLabel = 'Save', hideTitle = false }) {
  const [form, setForm] = useState({
    title: initial.title ?? '',
    genre: initial.genre ?? '',
    status: initial.status ?? 'backlog',
    rating: initial.rating ?? 0,
    hours_played: initial.hours_played ?? '',
    date_started: initial.date_started ?? '',
    date_finished: initial.date_finished ?? '',
    notes: initial.notes ?? '',
    cover_url: initial.cover_url ?? '',
    steam_app_id: initial.steam_app_id ?? '',
    rawg_id: initial.rawg_id ?? '',
  });
  const [detailsOpen, setDetailsOpen] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      title: form.title,
      genre: form.genre || null,
      status: form.status,
      rating: form.rating !== '' && form.rating !== 0 ? Number(form.rating) : null,
      hours_played: form.hours_played !== '' ? Number(form.hours_played) : null,
      date_started: form.date_started || null,
      date_finished: form.date_finished || null,
      notes: form.notes || null,
      cover_url: form.cover_url || null,
      steam_app_id: form.steam_app_id !== '' ? Number(form.steam_app_id) : null,
      rawg_id: form.rawg_id !== '' ? Number(form.rawg_id) : null,
      genres:       initial.genres       ?? null,
      tags:         initial.tags         ?? null,
      release_date: initial.release_date ?? null,
      developer:    initial.developer    ?? null,
      publisher:    initial.publisher    ?? null,
      metascore:    initial.metascore    ?? null,
      screenshots:  initial.screenshots  ?? null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {!hideTitle && (
        <label className={styles.field}>
          Titre *
          <input required value={form.title} onChange={set('title')} />
        </label>
      )}

      {/* Status pills */}
      <div className={styles.field}>
        Statut
        <div className={styles.statusPills}>
          {STATUSES.map(s => (
            <button
              key={s.value}
              type="button"
              className={`${styles.statusPill} ${form.status === s.value ? styles.active : ''}`}
              style={{ '--pill-color': `var(--status-${s.value})` }}
              onClick={() => setForm(f => ({ ...f, status: s.value }))}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Rating slider */}
      <div className={styles.field}>
        Note
        <div className={styles.sliderRow}>
          <input
            className={styles.slider}
            type="range"
            min="0"
            max="100"
            value={form.rating ?? 0}
            onChange={e => setForm(f => ({ ...f, rating: +e.target.value }))}
          />
          <span className={styles.ratingValue}>{form.rating ?? 0}</span>
        </div>
      </div>

      {/* Hours */}
      <label className={styles.field}>
        Heures jouées
        <input type="number" min="0" step="0.1" value={form.hours_played} onChange={set('hours_played')} />
      </label>

      {/* Dates on same line */}
      <div className={styles.datesRow}>
        <label className={styles.field}>
          Commencé
          <input type="date" value={form.date_started} onChange={set('date_started')} />
        </label>
        <label className={styles.field}>
          Terminé
          <input type="date" value={form.date_finished} onChange={set('date_finished')} />
        </label>
      </div>

      {/* Notes */}
      <label className={styles.field}>
        Notes
        <textarea rows={3} value={form.notes} onChange={set('notes')} />
      </label>

      {/* Details accordion */}
      <div className={styles.accordion}>
        <button
          type="button"
          className={styles.accordionToggle}
          onClick={() => setDetailsOpen(o => !o)}
        >
          Détails {detailsOpen ? '▲' : '▼'}
        </button>
        {detailsOpen && (
          <div className={styles.accordionContent}>
            <label className={styles.field}>
              Cover URL
              <input value={form.cover_url} onChange={set('cover_url')} />
            </label>
            <label className={styles.field}>
              Steam App ID
              <input type="number" value={form.steam_app_id} onChange={set('steam_app_id')} />
            </label>
            <label className={styles.field}>
              Genre
              <input value={form.genre} onChange={set('genre')} />
            </label>
          </div>
        )}
      </div>

      <button type="submit" className={styles.submitBtn}>{submitLabel}</button>
    </form>
  );
}
