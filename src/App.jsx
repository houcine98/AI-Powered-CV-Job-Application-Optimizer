import { Navigate, Route, Routes } from "react-router-dom";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminPage from "./pages/AdminPage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route element={<ProtectedRoute />}>
          <Route index element={<DashboardPage />} />
          <Route path="results/:analysisId" element={<ResultsPage />} />
        </Route>
        <Route element={<ProtectedRoute requireAdmin />}>
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
