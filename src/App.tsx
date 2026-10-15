import { Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Spinner } from "./components/Spinner";
import { useAuth } from "./hooks/useAuth";
import { AdminAuditLogsPage } from "./pages/AdminAuditLogsPage";
import { AdminCustomersPage } from "./pages/AdminCustomersPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { TransactionsPage } from "./pages/TransactionsPage";
import { TransferPage } from "./pages/TransferPage";

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-bg">
        <Spinner label="Loading…" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin/customers" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route
        element={
          <ProtectedRoute requireRole="customer">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute requireRole="admin">
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/customers" element={<AdminCustomersPage />} />
        <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
