import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export function PendingApproval() {
  const { providerStatus } = useAuth();

  return (
    <div style={{ maxWidth: 500, margin: "80px auto", padding: 24, textAlign: "center" }}>
      <h1>Account Under Review</h1>
      {providerStatus === "rejected" ? (
        <p style={{ color: "red" }}>
          Your application has been rejected. Please contact support for more information.
        </p>
      ) : (
        <p>
          Your service provider application is being reviewed. You'll get access to the
          marketplace once an admin approves your profile.
        </p>
      )}
      <button
        onClick={() => supabase.auth.signOut()}
        style={{ marginTop: 24, padding: "8px 24px" }}
      >
        Sign Out
      </button>
    </div>
  );
}
