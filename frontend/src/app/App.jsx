import React from 'react';
import { BrowserRouter } from 'react-router';
import { AuthProvider } from './providers/AuthProvider.jsx';
import { ThemeProvider } from './providers/ThemeProvider.jsx';
import { AppRoutes } from './router.jsx';

export function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
