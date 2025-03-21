import React, { useContext } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import './styles/global.css';
import './styles/lightTheme.css';

const Root = () => {
  const { isDarkMode } = useContext(ThemeContext);

  React.useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }, [isDarkMode]);

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <ThemeProvider>
    <Root />
  </ThemeProvider>
);