// protectRoutes.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useContext } from "react";
import { userStateContext } from "../contexts/userState";

export function CheckUserIsLogin() {
    const { userState } = useContext(userStateContext);
    if (userState === 1) {
        return <Navigate to="/home" replace />;
    }

    return <Outlet />;
};

export function CheckUserIsLogout(){
    const { userState } = useContext(userStateContext);
    if (userState === 0) {
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};
