import AppRouter from './router/AppRouter';
import UserStateProvider from './providers/UserStateProvider';

import '@/shared/styles/globals.css';
import '@/shared/styles/theme.css';

const App = () => (
  <UserStateProvider>
    <AppRouter />
  </UserStateProvider>
);

export default App;
