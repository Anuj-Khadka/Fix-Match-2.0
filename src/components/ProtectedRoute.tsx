import { Navigate } from "react-router-dom";
import { useAuth, type Role } from "../hooks/useAuth";

interface Props {
  children: React.ReactNode;
  /** Which roles can access this route */
  allowedRoles?: Role[];
  /** If true, provider must be approved to access */
  requireApprovedProvider?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireApprovedProvider = false,
}: Props) {
  const { user, role, isApprovedProvider, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  // Not logged in
  if (!user || !role) {
    return <Navigate to="/login" replace />;
  }

  // Role not allowed
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  // Provider must be approved
  if (requireApprovedProvider && role === "provider" && !isApprovedProvider) {
    return <Navigate to="/pending-approval" replace />;
  }

  return <>{children}</>;
}
