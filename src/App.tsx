import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LandingPage } from "./pages/LandingPage";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import { PendingApproval } from "./pages/PendingApproval";
import { Dashboard } from "./pages/Dashboard";
import { ProviderDashboard } from "./pages/ProviderDashboard";

/** Picks the right dashboard based on the user's role */
function RoleDashboard() {
  const { role } = useAuth();
  if (role === "provider") return <ProviderDashboard />;
  return <Dashboard />;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" replace /> : <SignUp />} />

      {/* Auth-gated */}
      <Route path="/pending-approval" element={<PendingApproval />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute
            allowedRoles={["client", "provider", "admin"]}
            requireApprovedProvider
          >
            <RoleDashboard />
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
