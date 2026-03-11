import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export function Dashboard() {
  const { user, role } = useAuth();

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 24 }}>
      <h1>Fixmatch Dashboard</h1>
      <p>Welcome, {user?.email}</p>
      <p>Role: <strong>{role}</strong></p>
      <button
        onClick={() => supabase.auth.signOut()}
        style={{ marginTop: 16, padding: "8px 24px" }}
      >
        Sign Out
      </button>
    </div>
  );
}
