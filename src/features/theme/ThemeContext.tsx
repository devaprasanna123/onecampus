import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../auth/AuthContext';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_STORAGE_KEY = 'onecampus-theme';
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const normalizeTheme = (value: unknown): Theme | null => {
  return value === 'dark' || value === 'light' ? value : null;
};

const getStoredTheme = (): Theme | null => {
  if (typeof window === 'undefined') return null;
  return normalizeTheme(window.localStorage.getItem(THEME_STORAGE_KEY));
};

const applyThemeClass = (theme: Theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, loading, updateProfile } = useAuth();
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    setThemeState(getStoredTheme() ?? 'light');
  }, []);

  useEffect(() => {
    applyThemeClass(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    window.localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      setThemeState(getStoredTheme() ?? 'light');
      return;
    }

    const dbTheme = normalizeTheme(profile?.theme_preference);

    if (dbTheme) {
      setThemeState(dbTheme);
      return;
    }

    setThemeState('light');

    if (!profile?.id) return;

    updateProfile({ ...profile, theme_preference: 'light' });
    supabase
      .from('users')
      .update({ theme_preference: 'light' })
      .eq('id', profile.id)
      .then(({ error }: { error: any }) => {
        if (error) {
          console.error('[theme] Failed to save default light theme:', error);
        }
      });
  }, [loading, user, profile?.id, profile?.theme_preference]);

  const setTheme = async (nextTheme: Theme) => {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);

    if (!profile?.id) return;

    updateProfile({ ...profile, theme_preference: nextTheme });

    const { error } = await supabase
      .from('users')
      .update({ theme_preference: nextTheme })
      .eq('id', profile.id);

    if (error) {
      console.error('[theme] Failed to save theme preference:', error);
    }
  };

  const value = useMemo<ThemeContextType>(
    () => ({
      theme,
      setTheme,
      toggleTheme: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, profile?.id, profile?.theme_preference]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
