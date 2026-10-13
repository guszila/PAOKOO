import { useState, useEffect } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ColorTheme = 'dmg' | 'berry' | 'kiwi' | 'teal' | 'dandelion' | 'atomic';

export interface ColorThemeOption {
  id: ColorTheme;
  name: string;
  nameTh: string;
  emoji: string;
  screenColor: string;
  accentColor: string;
  headerBg: string;
}

export const COLOR_THEMES: ColorThemeOption[] = [
  {
    id: 'dmg',
    name: 'DMG Classic',
    nameTh: 'เขียวคลาสสิก 1989',
    emoji: '🎮',
    screenColor: '#9BBC0F',
    accentColor: '#8B1E43',
    headerBg: '#353842',
  },
  {
    id: 'berry',
    name: 'Berry Pink',
    nameTh: 'ชมพูเบอร์รี่ หวานน่ารัก',
    emoji: '🍓',
    screenColor: '#FBCFE8',
    accentColor: '#BE185D',
    headerBg: '#38232F',
  },
  {
    id: 'kiwi',
    name: 'Kiwi Mint',
    nameTh: 'เขียวมินต์ สดใส',
    emoji: '🥝',
    screenColor: '#A7F3D0',
    accentColor: '#059669',
    headerBg: '#1E3526',
  },
  {
    id: 'teal',
    name: 'Teal Ocean',
    nameTh: 'ฟ้าน้ำทะเล เรโทร',
    emoji: '🌊',
    screenColor: '#BAE6FD',
    accentColor: '#0284C7',
    headerBg: '#1E2D3D',
  },
  {
    id: 'dandelion',
    name: 'Dandelion',
    nameTh: 'เหลืองสดใส มินิมอล',
    emoji: '🌼',
    screenColor: '#FEF08A',
    accentColor: '#D97706',
    headerBg: '#383020',
  },
  {
    id: 'atomic',
    name: 'Atomic Purple',
    nameTh: 'ม่วงนีออน 90s',
    emoji: '🔮',
    screenColor: '#DDD6FE',
    accentColor: '#7C3AED',
    headerBg: '#2B213B',
  },
];

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('paokoo_theme') as ThemeMode) || 'system';
  });

  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    return (localStorage.getItem('paokoo_color_theme') as ColorTheme) || 'dmg';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-color-theme', colorTheme);
    localStorage.setItem('paokoo_color_theme', colorTheme);

    const themeConfig = COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0];
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', isDark ? '#141814' : themeConfig.headerBg);
    }
  }, [colorTheme, theme]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      const themeConfig = COLOR_THEMES.find((c) => c.id === colorTheme) || COLOR_THEMES[0];
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        meta.setAttribute('content', isDark ? '#141814' : themeConfig.headerBg);
      }
    };

    applyTheme();
    localStorage.setItem('paokoo_theme', theme);

    const listener = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme, colorTheme]);

  return { theme, setTheme, colorTheme, setColorTheme };
}
