import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Settings from './pages/Settings';
import ProfileSection from './pages/Settings/sections/ProfileSection';
import GeneralSection from './pages/Settings/sections/GeneralSection';

import { CheckUserIsLogin, CheckUserIsLogout } from './utils/protectRoutes';
import { userStateContext } from './contexts/userState';

import './assets/styles/globals.css';
import './assets/styles/theme.css';

function App() {
  const [userState, setUserState] = useState();

  useEffect(() => {
    const defineUserState = async () => {
      const response = await fetch("/api/v1/user/info", {
        method: "GET",
        credentials: "include"
      });
      setUserState(response.redirected ? 0 : 1);
    };

    defineUserState();
  }, []);

  return (
    <userStateContext.Provider value={{ userState, setUserState }}>
      <BrowserRouter>
        <Routes>
          <Route element={<CheckUserIsLogout />}>
            <Route path="/home" element={<Home />} />
            <Route path="/settings/*" element={<Settings />}>
              <Route path="profile" element={<ProfileSection />} />
              <Route path="general" element={<GeneralSection />} />
            </Route>
          </Route>

          <Route element={<CheckUserIsLogin />}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </userStateContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
