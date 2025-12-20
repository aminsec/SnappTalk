import AppRouter from './router/AppRouter';
import UserStateProvider from './providers/UserStateProvider';
import SocketProvider from './providers/SocketProvider';

import { Toaster } from 'react-hot-toast';

import '@/shared/styles/globals.css';
import '@/shared/styles/theme.css';

const App = () => (
  <UserStateProvider>
    <SocketProvider>
      <Toaster position="top-center" />
      <AppRouter />
    </SocketProvider>
  </UserStateProvider>
);

export default App;
