import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './hooks/useTheme';
import './index.css';

// Suppress React DevTools suggestion in development (optional)
if (import.meta.env.DEV) {
  const originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    const message = args.join(' ');
    // Filter out React DevTools suggestion
    if (message.includes('Download the React DevTools')) {
      return; // Suppress this specific message
    }
    originalConsoleLog.apply(console, args);
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);