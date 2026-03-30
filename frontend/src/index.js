// src/index.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { Provider, useSelector } from "react-redux";
import store from "./store";
import "./index.css";

import App from "./App";
import PrivateRoute from "./components/Utils/PrivateRoute";
import AdminRoute from "./components/Utils/AdminRoute";
import AdminUsers from "./screens/admin/AdminUsersScreen";
import Login from "./screens/LoginScreen/LoginScreen";
import ForgotPassword from "./screens/ForgotPasswordScreen/ForgotPasswordScreen";
import ResetPassword from "./screens/ResetPasswordScreen/ResetPasswordScreen";
import NotFound from "./screens/NotFoundScreen/NotFoundScreen";

import UserDashboard from "./screens/user/userDashboardScreen";
import AdminDashboard from "./screens/admin/AdminDashboardScreen";
import AdminEntreprises from "./screens/admin/AdminEntreprisesScreen";


// 🔹 DashboardRedirect - redirige selon rôle
const DashboardRedirect = () => {
  const { userInfo } = useSelector((state) => state.auth);

  if (!userInfo) return <Navigate to="/login" replace />;

  return userInfo.role === "admin" ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

// 🔹 Router
const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      {/* Pages publiques */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* Redirection depuis "/" selon rôle */}
      <Route path="/" element={<DashboardRedirect />} />

      {/* Routes privées utilisateurs */}
      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<UserDashboard />} />
      </Route>

      {/* Routes admin */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/entreprises" element={<AdminEntreprises />} />
        <Route path="/admin/users" element={<AdminUsers />} />

      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Route>
  )
);

// 🔹 Render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>
);