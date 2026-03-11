import { BrowserRouter, Routes, Route, NavLink, Link, useLocation } from 'react-router-dom';
import { ThemeProvider, useTheme } from './styles/ThemeContext';
import HomePage from './pages/HomePage';
import AddGamePage from './pages/AddGamePage';
import EditGamePage from './pages/EditGamePage';
import SettingsPage from './pages/SettingsPage';
import styles from './App.module.css';

function NavContent() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  const navLinkClass = ({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`;

  return (
    <>
      <header className={styles.header}>
        <Link to="/" className={styles.logo}>Savepoint</Link>
        <nav className={styles.nav}>
          <NavLink to="/" end className={navLinkClass}>Bibliothèque</NavLink>
          <NavLink to="/settings" className={navLinkClass}>Paramètres</NavLink>
        </nav>
        <div className={styles.actions}>
          <button className={styles.themeToggle} onClick={toggle} aria-label="Changer de thème">
            {theme === 'dark' ? '☀' : '☾'}
          </button>
          <Link to="/add" className={styles.addBtn}>+ Ajouter</Link>
        </div>
      </header>

      <main className={styles.main}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddGamePage />} />
          <Route path="/edit/:id" element={<EditGamePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {/* Mobile bottom nav */}
      <nav className={styles.bottomNav}>
        <Link to="/" className={`${styles.bottomNavItem} ${location.pathname === '/' ? styles.bottomNavItemActive : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
          Accueil
        </Link>
        <Link to="/add" className={`${styles.bottomNavItem} ${location.pathname === '/add' ? styles.bottomNavItemActive : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Ajouter
        </Link>
        <Link to="/settings" className={`${styles.bottomNavItem} ${location.pathname === '/settings' ? styles.bottomNavItemActive : ''}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          Paramètres
        </Link>
      </nav>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <NavContent />
      </BrowserRouter>
    </ThemeProvider>
  );
}
