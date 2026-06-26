"use client";

import { useEffect } from 'react';
import { useApp } from '@/lib/context';
import type { AppTheme } from '@/lib/types';

const themeColors: Record<AppTheme, string> = {
  'clinical-light': '#f7faf9',
  'graphite-dark': '#0a0f12',
  signal: '#08111f',
  'warm-minimal': '#fbf7ef',
};

const themeClasses: AppTheme[] = ['clinical-light', 'graphite-dark', 'signal', 'warm-minimal'];

export function ThemeSync() {
  const { data } = useApp();

  useEffect(() => {
    const theme = data.theme ?? (data.darkMode ? 'graphite-dark' : 'clinical-light');
    const root = document.documentElement;
    root.classList.remove(...themeClasses);
    root.classList.add(theme);
    root.dataset.theme = theme;
    root.classList.toggle('dark', theme === 'graphite-dark' || theme === 'signal');
    root.classList.add('bg-background');

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-peptideos-theme]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      themeMeta.dataset.peptideosTheme = 'true';
      document.head.append(themeMeta);
    }

    themeMeta.content = themeColors[theme];
  }, [data.darkMode, data.theme]);

  return null;
}
