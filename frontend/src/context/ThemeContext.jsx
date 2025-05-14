import React, { createContext, useContext } from 'react';

export const ThemeContext = createContext();

export const ThemeProvider = ({ value, children }) => {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};