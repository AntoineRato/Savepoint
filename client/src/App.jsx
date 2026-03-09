import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AddGamePage from './pages/AddGamePage';
import EditGamePage from './pages/EditGamePage';
import SettingsPage from './pages/SettingsPage';

const navStyle = ({ isActive }) => ({
  textDecoration: 'none',
  fontWeight: isActive ? 700 : 400,
  color: isActive ? '#2563eb' : '#374151',
});

export default function App() {
  return (
    <BrowserRouter>
      <header style={{ borderBottom: '1px solid #e5e7eb', padding: '12px 24px', display: 'flex', gap: 24, alignItems: 'center' }}>
        <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>Savepoint</span>
        <NavLink to="/" end style={navStyle}>Home</NavLink>
        <NavLink to="/add" style={navStyle}>Add Game</NavLink>
        <NavLink to="/settings" style={navStyle}>Settings</NavLink>
      </header>
      <main style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/add" element={<AddGamePage />} />
          <Route path="/edit/:id" element={<EditGamePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
