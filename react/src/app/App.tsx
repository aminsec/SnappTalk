import React from 'react';
import AppRouter from './router/AppRouter';
import UserStateProvider from './providers/UserStateProvider';
import SocketProvider from './providers/SocketProvider';

import { Toaster } from 'react-hot-toast';

import '@/shared/styles/globals.css';
import '@/shared/styles/theme.css';

const App: React.FC = () => (
  <UserStateProvider>
    <SocketProvider>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: 'rgba(22, 27, 28, 0.94)',
            color: '#F5F6FA',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderRadius: '12px',
            boxShadow: '0 16px 36px rgba(0, 0, 0, 0.45)',
            fontSize: '14px',
            padding: '12px 18px',
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'linear-gradient(135deg, rgba(40, 18, 22, 0.96), rgba(22, 27, 28, 0.96))',
              color: '#fca5a5',
            },
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
            style: {
              border: '1px solid rgba(16, 185, 129, 0.4)',
              background: 'linear-gradient(135deg, rgba(16, 36, 26, 0.96), rgba(22, 27, 28, 0.96))',
              color: '#a7f3d0',
            },
          },
        }}
      />
      <AppRouter />
    </SocketProvider>
  </UserStateProvider>
);

export default App;

