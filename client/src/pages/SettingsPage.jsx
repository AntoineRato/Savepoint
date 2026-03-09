import { useEffect, useState } from 'react';
import { getSettings, saveSettings } from '../api/client';

export default function SettingsPage() {
  const [form, setForm] = useState({ rawg_key: '', steam_key: '', steam_id: '' });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getSettings()
      .then((s) => setForm({ rawg_key: s.rawg_key ?? '', steam_key: s.steam_key ?? '', steam_id: s.steam_id ?? '' }))
      .catch((err) => setError(err.message));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaved(false);
    try {
      await saveSettings(form);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h1>Settings</h1>
      {error && <div style={{ color: '#dc2626', marginBottom: 12 }}>{error}</div>}
      {saved && <div style={{ color: '#16a34a', marginBottom: 12 }}>Settings saved.</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 400 }}>
        <Field label="RAWG API Key">
          <input type="password" value={form.rawg_key} onChange={set('rawg_key')} autoComplete="off" />
        </Field>
        <Field label="Steam API Key">
          <input type="password" value={form.steam_key} onChange={set('steam_key')} autoComplete="off" />
        </Field>
        <Field label="Steam User ID">
          <input value={form.steam_id} onChange={set('steam_id')} />
        </Field>
        <button type="submit" style={{ padding: '8px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, alignSelf: 'flex-start' }}>
          Save
        </button>
      </form>
    </div>
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
