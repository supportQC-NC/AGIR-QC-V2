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

// utilitaire
import PrivateRoute from "./components/Utils/PrivateRoute";
import AdminRoute from "./components/Utils/AdminRoute";
import AdminUsers from "./screens/admin/AdminUsersScreen";
// public
import Login from "./screens/LoginScreen/LoginScreen";
import ForgotPassword from "./screens/ForgotPasswordScreen/ForgotPasswordScreen";
import ResetPassword from "./screens/ResetPasswordScreen/ResetPasswordScreen";
import NotFound from "./screens/NotFoundScreen/NotFoundScreen";

//user
import UserDashboard from "./screens/User/UserDashboardScreen";
import ProfileScreen from "./screens/User/ProfileScreen";
import ArticleSearch from "./screens/User/UserArticleSearch";
import UserReappro from "./screens/User/UserReappro";
import ReleveScreen from "./screens/User/RelevesScreen";

// Admin
import AdminTachesCronScreen from "./screens/admin/AdminTachesCronScreen";
import AdminOutilsScreen from "./screens/admin/AdminOutilsScreen";
import AdminDashboard from "./screens/admin/AdminDashboardScreen";
import AdminEntreprises from "./screens/admin/AdminEntreprisesScreen";
import AdminConcurrents from "./screens/admin/AdminConcurrentsScreen";
import AdminClientDetailScreen from "./screens/admin/AdminClientDetailsScreen";
import AdminArticleInfosScreen from "./screens/admin/AdminArticleInfosScreen";
import AdminArticles from "./screens/admin/AdminArticlesScreen";
import AdminFournisseursScreen from "./screens/admin/AdminFournisseursScreen";
import AdminFournisseurInfosScreen from "./screens/admin/AdminFournisseurInfosScreen";
import AdminClientsScreen from "./screens/admin/AdminClientsScreen";
import AdminReapproScreen from "./screens/admin/AdminReapproScreen";
import AdminCommandesScreen from "./screens/admin/AdminCommandesScreen";
import AdminCommandeDetailsScreen from "./screens/admin/AdminCommandeDetailsScreen";
import AdminFacturesScreen from "./screens/admin/AdminFacturesScreen";
import AdminFactureDetailScreen from "./screens/admin/AdminFactureDetailsScreen";
import AdminDemandesReapproScreen from "./screens/admin/AdminDemandesReapproScreen";

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
        <Route path="/articles" element={<ArticleSearch />} />
        <Route path="/releve" element={<ReleveScreen />} />
        <Route path="/reappro" element={<UserReappro />} />
        <Route path="/profile" element={<ProfileScreen />} />
      </Route>

      {/* Routes admin */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/entreprises" element={<AdminEntreprises />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/outils" element={<AdminOutilsScreen />} />
        <Route path="/admin/taches-cron" element={<AdminTachesCronScreen />} />
        <Route path="/admin/concurrents" element={<AdminConcurrents />} />
        <Route
          path="/admin/fournisseurs"
          element={<AdminFournisseursScreen />}
        />
        <Route
          path="/admin/fournisseurs/:nomDossierDBF"
          element={<AdminFournisseursScreen />}
        />
        <Route
          path="/admin/fournisseurs/:nomDossierDBF/:fournId"
          element={<AdminFournisseurInfosScreen />}
        />
        <Route path="/admin/articles" element={<AdminArticles />} />
        <Route
          path="/admin/articles/:nomDossierDBF/:nart"
          element={<AdminArticleInfosScreen />}
        />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/entreprises" element={<AdminEntreprises />} />
        <Route path="/admin/reappros" element={<AdminReapproScreen />} />
        <Route
          path="/admin/demandes-reappro"
          element={<AdminDemandesReapproScreen />}
        />
        <Route path="/admin/articles" element={<AdminArticles />} />
        <Route path="/admin/clients" element={<AdminClientsScreen />} />
        <Route
          path="/admin/clients/:nomDossierDBF"
          element={<AdminClientsScreen />}
        />
        <Route
          path="/admin/clients/:nomDossierDBF/:tiers"
          element={<AdminClientDetailScreen />}
        />
        <Route path="/admin/concurrents" element={<AdminConcurrents />} />
        <Route
          path="/admin/articles/:nomDossierDBF/:nart"
          element={<AdminArticleInfosScreen />}
        />
        <Route path="/admin/commandes" element={<AdminCommandesScreen />} />
        <Route
          path="/admin/commandes/:nomDossierDBF"
          element={<AdminCommandesScreen />}
        />
        <Route
          path="/admin/commandes/:nomDossierDBF/:numcde"
          element={<AdminCommandeDetailsScreen />}
        />
        <Route path="/admin/factures" element={<AdminFacturesScreen />} />
        <Route
          path="/admin/factures/:nomDossierDBF"
          element={<AdminFacturesScreen />}
        />
        <Route
          path="/admin/factures/:nomDossierDBF/:numfact"
          element={<AdminFactureDetailScreen />}
        />
        <Route
          path="/admin/fournisseurs"
          element={<AdminFournisseursScreen />}
        />
        <Route
          path="/admin/fournisseurs/:nomDossierDBF"
          element={<AdminFournisseursScreen />}
        />
        <Route
          path="/admin/fournisseurs/:nomDossierDBF/:fournId"
          element={<AdminFournisseurInfosScreen />}
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
);

// 🔹 Render
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </React.StrictMode>,
);
