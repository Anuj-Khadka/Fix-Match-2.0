import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { useJobs, type JobCategory } from "../hooks/useJobs";
import { supabase } from "../lib/supabase";

const CATEGORIES: { value: JobCategory; label: string; icon: string }[] = [
  { value: "plumbing", label: "Plumbing", icon: "\ud83d\udeb0" },
  { value: "electrical", label: "Electrical", icon: "\u26a1" },
  { value: "cleaning", label: "Cleaning", icon: "\ud83e\uddf9" },
];

export function Dashboard() {
  const { user, role } = useAuth();
  const geo = useGeolocation();
  const jobs = useJobs(user?.id);
  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(
    null,
  );

  console.log(user,role)

  // ── Searching State ──────────────────────────────────────────
  if (jobs.activeJob) {
    return (
      <div style={container}>
        <div style={card}>
          <div style={pulseContainer}>
            <div style={pulseRing} />
            <div style={pulseDot} />
          </div>
          <h2 style={{ margin: "24px 0 8px" }}>Searching for nearby Pros...</h2>
          <p style={{ color: "#666", margin: 0 }}>
            Category:{" "}
            <strong style={{ textTransform: "capitalize" }}>
              {jobs.activeJob.category}
            </strong>
          </p>
          <p style={{ color: "#888", fontSize: 14, marginTop: 4 }}>
            Status:{" "}
            <span
              style={{
                color:
                  jobs.activeJob.status === "accepted" ? "#16a34a" : "#ea580c",
                fontWeight: 600,
              }}
            >
              {jobs.activeJob.status}
            </span>
          </p>
          {jobs.error && <p style={errorText}>{jobs.error}</p>}
          <button
            onClick={jobs.cancelJob}
            disabled={jobs.loading}
            style={cancelBtn}
          >
            {jobs.loading ? "Cancelling..." : "Cancel Request"}
          </button>
        </div>
      </div>
    );
  }

  // ── Request Service State ────────────────────────────────────
  async function handleFindPro() {
    if (!selectedCategory) return;

    try {
      const coords = await geo.requestPosition();
      await jobs.createJob({ category: selectedCategory, ...coords });
    } catch {
      // error is already in geo.error or jobs.error
    }
  }

  return (
    <div style={container}>
      <div style={header}>
        <div>
          <h1 style={{ margin: 0 }}>Fixmatch</h1>
          <p style={{ margin: "4px 0 0", color: "#666" }}>
            Welcome, {user?.email}
          </p>
          <p style={{ margin: "2px 0 0", color: "#999", fontSize: 13 }}>
            Role: {role}
          </p>
        </div>
        <button onClick={() => supabase.auth.signOut()} style={signOutBtn}>
          Sign Out
        </button>
      </div>

      <div style={card}>
        <h2 style={{ marginTop: 0 }}>What do you need help with?</h2>

        <div style={categoryGrid}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                ...categoryBtn,
                borderColor:
                  selectedCategory === cat.value ? "#2563eb" : "#e5e7eb",
                backgroundColor:
                  selectedCategory === cat.value ? "#eff6ff" : "#fff",
              }}
            >
              <span style={{ fontSize: 32 }}>{cat.icon}</span>
              <span style={{ marginTop: 8, fontWeight: 500 }}>{cat.label}</span>
            </button>
          ))}
        </div>

        {(geo.error || jobs.error) && (
          <p style={errorText}>{geo.error || jobs.error}</p>
        )}

        <button
          onClick={handleFindPro}
          disabled={!selectedCategory || geo.loading || jobs.loading}
          style={{
            ...findProBtn,
            opacity: !selectedCategory || geo.loading || jobs.loading ? 0.5 : 1,
          }}
        >
          {geo.loading
            ? "Getting your location..."
            : jobs.loading
              ? "Creating request..."
              : "Find a Pro"}
        </button>
      </div>
    </div>
  );
}

/* ── Inline Styles ───────────────────────────────────────────── */

const container: React.CSSProperties = {
  maxWidth: 520,
  margin: "40px auto",
  padding: "0 16px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
};

const header: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: 24,
};

const signOutBtn: React.CSSProperties = {
  padding: "6px 16px",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  background: "#fff",
  cursor: "pointer",
  fontSize: 14,
};

const card: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: 24,
  textAlign: "center",
};

const categoryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: 12,
  margin: "16px 0 24px",
};

const categoryBtn: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
  borderRadius: 10,
  border: "2px solid #e5e7eb",
  background: "#fff",
  cursor: "pointer",
  transition: "all 0.15s",
};

const findProBtn: React.CSSProperties = {
  width: "100%",
  padding: "14px 24px",
  fontSize: 16,
  fontWeight: 600,
  color: "#fff",
  background: "#2563eb",
  border: "none",
  borderRadius: 8,
  cursor: "pointer",
};

const cancelBtn: React.CSSProperties = {
  marginTop: 24,
  padding: "12px 32px",
  fontSize: 15,
  fontWeight: 600,
  color: "#dc2626",
  background: "#fff",
  border: "2px solid #dc2626",
  borderRadius: 8,
  cursor: "pointer",
};

const errorText: React.CSSProperties = {
  color: "#dc2626",
  fontSize: 14,
  margin: "8px 0",
};

const pulseContainer: React.CSSProperties = {
  position: "relative",
  width: 80,
  height: 80,
  margin: "0 auto",
};

const pulseDot: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 20,
  height: 20,
  borderRadius: "50%",
  background: "#2563eb",
};

const pulseRing: React.CSSProperties = {
  position: "absolute",
  top: 0,
  left: 0,
  width: 80,
  height: 80,
  borderRadius: "50%",
  border: "3px solid #2563eb",
  animation: "pulse-ring 1.5s ease-out infinite",
};
