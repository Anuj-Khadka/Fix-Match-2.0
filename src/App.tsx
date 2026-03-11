import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { PendingApproval } from "./pages/PendingApproval";
import { Dashboard } from "./pages/Dashboard";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: 80 }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/" replace /> : <Login />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/" replace /> : <SignUp />}
      />
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route
        path="/"
        element={
          <ProtectedRoute
            allowedRoles={["client", "provider", "admin"]}
            requireApprovedProvider
          >
            <Dashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
