// src/main.jsx
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';  
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import { CheckUserIsLogin } from './utils/protectRoutes';
import { CheckUserIsLogout } from './utils/protectRoutes';
import { userStateContext } from './contexts/userState';
import './assets/styles/globals.css';
import './assets/styles/theme.css';

export default function App() {
  const [userState, setUserState] = useState(); // 0 = logged out, 1 = logged in (you can adjust this)

  //Defining user state
  useEffect(() => {
    const defineUserState = async () => {
      const request = await fetch("/api/v1/user/info", {
        method: "GET",
        credentials: "include"
      })

      if(request.redirected !== true ){
        setUserState(1);

      }else{
        setUserState(0);
      }
    }

    defineUserState();
  }, []);

  return (
    <userStateContext.Provider value={{userState, setUserState}}>
      <BrowserRouter>
        <Routes>
          {/* Protected routes */}
          <Route element={<CheckUserIsLogout />}>
            <Route path="/home" element={<Home />} /> 
          </Route>

          {/* Public routes */}
          <Route element={<CheckUserIsLogin />}>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          {/* Error pages */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </userStateContext.Provider>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
