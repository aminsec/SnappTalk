import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from '@/features/auth/pages/Login/LoginPage';
import ChatsPage from '@/features/chats/pages/Chats/ChatsPage';
import SettingsPage from '@/features/settings/pages/Settings/SettingsPage';
import ProfileSection from '@/features/settings/pages/Settings/sections/ProfileSection';
import GeneralSection from '@/features/settings/pages/Settings/sections/GeneralSection';
import AppearanceSection from '@/features/settings/pages/Settings/sections/AppearanceSection';
import ProfilePage from '@/features/members/pages/Profile/ProfilePage';
import NotFoundPage from '@/features/misc/pages/NotFound';
import { RequireAuth, RequireGuest } from '@/shared/utils/protectRoutes';

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route element={<RequireAuth />}>
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/members/:userId" element={<ProfilePage />} />
        <Route path="/settings/*" element={<SettingsPage />}>
          <Route path="profile" element={<ProfileSection />} />
          <Route path="general" element={<GeneralSection />} />
          <Route path="appearance" element={<AppearanceSection />} />
        </Route>
      </Route>

      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
