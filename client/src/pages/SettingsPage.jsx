import { useEffect, useState, useRef } from 'react';
import { getSettings, saveSettings, exportGames, importGames, syncSteam } from '../api/client';
import Toast from '../components/Toast';
import styles from './SettingsPage.module.css';

export default function SettingsPage() {
  const [form, setForm] = useState({ rawg_key: '', steam_key: '', steam_id: '' });
  const [syncing, setSyncing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileRef = useRef(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  };

  useEffect(() => {
    getSettings()
      .then((s) => setForm({ rawg_key: s.rawg_key ?? '', steam_key: s.steam_key ?? '', steam_id: s.steam_id ?? '' }))
      .catch((err) => addToast(err.message, 'error'));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await saveSettings(form);
      addToast('Paramètres sauvegardés.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleSteamSync = async () => {
    setSyncing(true);
    try {
      const result = await syncSteam();
      addToast(result.message);
    } catch (err) {
      addToast(`Erreur : ${err.message}`, 'error');
    } finally {
      setSyncing(false);
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
      addToast('Export terminé.');
    } catch (err) {
      addToast(err.message, 'error');
    }
  };

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const games = JSON.parse(ev.target.result);
        const result = await importGames(games);
        addToast(`${result.imported} jeux importés, ${result.overwritten} écrasés.`);
      } catch (err) {
        addToast(err.message, 'error');
      }
    };
    reader.readAsText(file);
  };

  const handleImportInput = (e) => {
    handleFile(e.target.files[0]);
    e.target.value = '';
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Paramètres</h1>

      {/* API Keys */}
      <div className={styles.section}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.field}>
            Clé API RAWG
            <input type="password" value={form.rawg_key} onChange={set('rawg_key')} autoComplete="off" />
          </label>
          <label className={styles.field}>
            Clé API Steam
            <input type="password" value={form.steam_key} onChange={set('steam_key')} autoComplete="off" />
          </label>
          <label className={styles.field}>
            Steam User ID
            <input value={form.steam_id} onChange={set('steam_id')} />
          </label>
          <button type="submit" className={styles.submitBtn}>Sauvegarder</button>
        </form>
      </div>

      <hr className={styles.divider} />

      {/* Sync */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Sync</h2>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleSteamSync} disabled={syncing}>
            {syncing ? 'Synchronisation…' : 'Sync Steam'}
          </button>
        </div>
      </div>

      <hr className={styles.divider} />

      {/* Import / Export */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Import / Export</h2>
        <div className={styles.actions}>
          <button className={styles.actionBtn} onClick={handleExport}>Exporter (JSON)</button>
        </div>

        <input ref={fileRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportInput} />

        <div
          className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          style={{ marginTop: 12 }}
        >
          <p>Glisser un fichier .json ici</p>
          <button type="button" onClick={() => fileRef.current.click()}>ou parcourir</button>
        </div>
      </div>

      <Toast toasts={toasts} />
    </div>
  );
}
