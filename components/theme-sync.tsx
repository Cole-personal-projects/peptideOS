"use client";

import { useEffect } from 'react';
import { useApp } from '@/lib/context';

const lightThemeColor = '#f8fafc';
const darkThemeColor = '#0a0a0f';

export function ThemeSync() {
  const { data } = useApp();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', data.darkMode);
    root.classList.add('bg-background');

    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"][data-peptideos-theme]');
    if (!themeMeta) {
      themeMeta = document.createElement('meta');
      themeMeta.name = 'theme-color';
      themeMeta.dataset.peptideosTheme = 'true';
      document.head.append(themeMeta);
    }
    themeMeta.content = data.darkMode ? darkThemeColor : lightThemeColor;
  }, [data.darkMode]);

  return null;
}
