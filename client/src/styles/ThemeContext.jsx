import { createContext, useContext, useState, useEffect } from 'react';

export const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'dark');

  const setTheme = (t) => {
    setThemeState(t);
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  const toggle = () => ctx.setTheme(ctx.theme === 'dark' ? 'light' : 'dark');
  return { theme: ctx.theme, setTheme: ctx.setTheme, toggle };
}
