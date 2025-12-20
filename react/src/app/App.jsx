import AppRouter from './router/AppRouter';
import UserStateProvider from './providers/UserStateProvider';

import { Toaster } from 'react-hot-toast';

import '@/shared/styles/globals.css';
import '@/shared/styles/theme.css';

const App = () => (
  <UserStateProvider>
    <Toaster position="top-center" />
    <AppRouter />
  </UserStateProvider>
);

export default App;
