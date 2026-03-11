import { useEffect, useState, useRef } from 'react';
import { getSettings, saveSettings, exportGames, importGames } from '../api/client';

export default function SettingsPage() {
  const [form, setForm] = useState({ rawg_key: '', steam_key: '', steam_id: '' });
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileRef = useRef(null);

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

  const handleExport = async () => {
    try {
      const games = await exportGames();
      const blob = new Blob([JSON.stringify(games, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `savepoint-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const games = JSON.parse(ev.target.result);
        const result = await importGames(games);
        setImportResult(result);
      } catch (err) {
        setError(err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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

      <hr style={{ margin: '24px 0', borderColor: '#e5e7eb' }} />

      <h2 style={{ fontSize: '1.1rem', marginBottom: 12 }}>Import / Export</h2>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={handleExport}
          style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
          Exporter (JSON)
        </button>
        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} />
        <button onClick={() => fileRef.current.click()}
          style={{ padding: '7px 16px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontWeight: 500 }}>
          Importer
        </button>
      </div>
      {importResult && (
        <p style={{ marginTop: 10, fontSize: '0.9rem', color: '#16a34a' }}>
          {importResult.imported} jeux importés, {importResult.overwritten} écrasés.
        </p>
      )}
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
