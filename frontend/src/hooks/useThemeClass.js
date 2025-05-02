import { useEffect } from 'react';
import { useTheme } from './useTheme';

export const useThemeClass = () => {
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const html = document.documentElement;
    if (isDarkMode) {
      html.classList.add('dark-theme');
    } else {
      html.classList.remove('dark-theme');
    }
  }, [isDarkMode]);
};