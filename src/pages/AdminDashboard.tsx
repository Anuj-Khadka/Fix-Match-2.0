import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Briefcase,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  Shield,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tab = "overview" | "providers" | "users" | "jobs";

interface Profile {
  id: string;
  role: string;
  full_name: string;
  phone: string | null;
  created_at: string;
}

interface ProviderProfile {
  id: string;
  status: string;
  business_name: string | null;
  years_of_experience: number;
  bio: string | null;
  service_categories: string[];
  service_radius: number;
  base_rate: number | null;
  id_document_url: string | null;
  license_document_url: string | null;
  onboarding_step: number;
  reliability_score: number;
  cancellation_count: number;
  rejection_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  profiles: { full_name: string; phone: string | null } | null;
}

interface Job {
  id: string;
  category: string;
  status: string;
  description: string | null;
  created_at: string;
  client: { full_name: string } | null;
  provider: { full_name: string } | null;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function roleBadge(role: string) {
  const colors: Record<string, string> = {
    client: "bg-blue-100 text-blue-700",
    provider: "bg-emerald-100 text-emerald-700",
    admin: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[role] ?? "bg-gray-100 text-gray-600"}`}
    >
      {role}
    </span>
  );
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    pending_review: "bg-amber-100 text-amber-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-red-100 text-red-700",
    searching: "bg-blue-100 text-blue-700",
    accepted: "bg-amber-100 text-amber-700",
    completed: "bg-emerald-100 text-emerald-700",
    cancelled: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] ?? "bg-gray-100 text-gray-600"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

const TABS: { key: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "providers", label: "Providers", icon: ClipboardCheck },
  { key: "users", label: "Users", icon: Users },
  { key: "jobs", label: "Jobs", icon: Briefcase },
];

function Sidebar({
  active,
  onSelect,
}: {
  active: Tab;
  onSelect: (t: Tab) => void;
}) {
  const navigate = useNavigate();

  async function adminSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("adminSignOut error:", error);
      return;
    }

    navigate("/", { replace: true });
  }

  return (
    <aside className="flex w-56 flex-col border-r border-gray-200 bg-white">
      <div className="px-5 py-5">
        <span className="text-xl font-extrabold tracking-tight text-cobalt">
          fix<span className="text-gray-900">match</span>
        </span>
        <div className="mt-1 flex items-center gap-1.5">
          <Shield className="h-3.5 w-3.5 text-red-500" />
          <span className="text-xs font-medium text-red-500">Admin</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = active === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => onSelect(tab.key)}
              className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition cursor-pointer border-none ${
                isActive
                  ? "bg-cobalt/10 text-cobalt"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={adminSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 cursor-pointer border-none"
        >
          <LogOut className="h-4.5 w-4.5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview Tab                                                       */
/* ------------------------------------------------------------------ */

function OverviewTab() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProviders: 0,
    pendingProviders: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [users, providers, pendingProviders, jobs, activeJobs, completedJobs] =
        await Promise.all([
          supabase.from("profiles").select("id", { count: "exact", head: true }),
          supabase
            .from("provider_profiles")
            .select("id", { count: "exact", head: true }),
          supabase
            .from("provider_profiles")
            .select("id", { count: "exact", head: true })
            .eq("status", "pending_review"),
          supabase.from("jobs").select("id", { count: "exact", head: true }),
          supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .in("status", ["searching", "accepted"]),
          supabase
            .from("jobs")
            .select("id", { count: "exact", head: true })
            .eq("status", "completed"),
        ]);

      setStats({
        totalUsers: users.count ?? 0,
        totalProviders: providers.count ?? 0,
        pendingProviders: pendingProviders.count ?? 0,
        totalJobs: jobs.count ?? 0,
        activeJobs: activeJobs.count ?? 0,
        completedJobs: completedJobs.count ?? 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <p className="text-sm text-gray-400">Loading...</p>;

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "text-cobalt" },
    { label: "Total Providers", value: stats.totalProviders, color: "text-emerald-600" },
    { label: "Pending Review", value: stats.pendingProviders, color: "text-amber-600" },
    { label: "Total Jobs", value: stats.totalJobs, color: "text-cobalt" },
    { label: "Active Jobs", value: stats.activeJobs, color: "text-blue-600" },
    { label: "Completed Jobs", value: stats.completedJobs, color: "text-emerald-600" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      <div className="mt-6 grid grid-cols-3 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <p className="text-sm font-medium text-gray-500">{c.label}</p>
            <p className={`mt-1 text-3xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Provider Review Tab                                                */
/* ------------------------------------------------------------------ */

function ProviderReviewTab() {
  const { user } = useAuth();
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProviderProfile | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState<string>("pending_review");
  const [docUrls, setDocUrls] = useState<{ govId: string; license: string }>({
    govId: "",
    license: "",
  });

  useEffect(() => {
    loadProviders();
  }, [filter]);

  async function loadProviders() {
    setLoading(true);
    let query = supabase
      .from("provider_profiles")
      .select("*, profiles!provider_profiles_id_fkey(full_name, phone)")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("status", filter);
    }

    const { data, error } = await query;
    if (error) console.error("loadProviders error:", error);
    setProviders((data as ProviderProfile[]) ?? []);
    setLoading(false);
  }

  async function selectProvider(p: ProviderProfile) {
    setSelected(p);
    setShowRejectInput(false);
    setRejectReason("");

    // Get signed URLs for documents
    const urls = { govId: "", license: "" };
    if (p.id_document_url) {
      const { data } = await supabase.storage
        .from("provider-docs")
        .createSignedUrl(p.id_document_url, 3600);
      if (data) urls.govId = data.signedUrl;
    }
    if (p.license_document_url) {
      const { data } = await supabase.storage
        .from("provider-docs")
        .createSignedUrl(p.license_document_url, 3600);
      if (data) urls.license = data.signedUrl;
    }
    setDocUrls(urls);
  }

  async function updateStatus(status: "approved" | "rejected") {
    if (!selected || !user) return;
    setActionLoading(true);

    const update: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    };
    if (status === "rejected") {
      update.rejection_reason = rejectReason;
    }

    await supabase
      .from("provider_profiles")
      .update(update)
      .eq("id", selected.id);

    setActionLoading(false);
    setSelected(null);
    loadProviders();
  }

  if (selected) {
    const p = selected;
    const name = p.profiles?.full_name || p.business_name || "Unknown";
    return (
      <div>
        <button
          onClick={() => setSelected(null)}
          className="mb-4 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-cobalt transition cursor-pointer border-none bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" /> Back to list
        </button>

        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {p.business_name && p.business_name !== name ? p.business_name + " · " : ""}
                {p.years_of_experience} years experience
              </p>
            </div>
            {statusBadge(p.status)}
          </div>

          {p.bio && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700">Bio</h3>
              <p className="mt-1 text-sm text-gray-600">{p.bio}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Services</h3>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {(p.service_categories ?? []).map((cat) => (
                  <span
                    key={cat}
                    className="rounded-full bg-cobalt/10 px-2.5 py-0.5 text-xs font-medium text-cobalt"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Preferences</h3>
              <p className="mt-1 text-sm text-gray-600">
                {p.service_radius} mile radius · ${p.base_rate ?? "N/A"}/hr
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700">Reliability</h3>
              <p className="mt-1 text-sm text-gray-600">
                {p.reliability_score}/5.00 · {p.cancellation_count} cancellations
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-700">Submitted</h3>
              <p className="mt-1 text-sm text-gray-600">{formatDate(p.created_at)}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700">Uploaded Documents</h3>
            <div className="mt-2 grid grid-cols-2 gap-3">
              {docUrls.govId ? (
                <a
                  href={docUrls.govId}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-cobalt hover:bg-cobalt/5 transition"
                >
                  <Eye className="h-4 w-4" /> Government ID
                </a>
              ) : (
                <span className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400">
                  No Gov ID uploaded
                </span>
              )}
              {docUrls.license ? (
                <a
                  href={docUrls.license}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-cobalt hover:bg-cobalt/5 transition"
                >
                  <Eye className="h-4 w-4" /> Professional License
                </a>
              ) : (
                <span className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-400">
                  No license uploaded
                </span>
              )}
            </div>
          </div>

          {/* Rejection reason display */}
          {p.status === "rejected" && p.rejection_reason && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">Rejection Reason</p>
              <p className="mt-1 text-sm text-red-600">{p.rejection_reason}</p>
            </div>
          )}

          {/* Action buttons */}
          {(p.status === "pending_review" || p.status === "pending") && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              {showRejectInput ? (
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason for rejection..."
                    rows={3}
                    className="block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus("rejected")}
                      disabled={actionLoading || !rejectReason.trim()}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition cursor-pointer border-none"
                    >
                      {actionLoading ? "Rejecting..." : "Confirm Reject"}
                    </button>
                    <button
                      onClick={() => setShowRejectInput(false)}
                      className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={() => updateStatus("approved")}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 transition cursor-pointer border-none"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {actionLoading ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={() => setShowRejectInput(true)}
                    className="flex items-center gap-2 rounded-xl border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition cursor-pointer"
                  >
                    <XCircle className="h-4 w-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Provider Review</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cobalt"
        >
          <option value="pending_review">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading...</p>
      ) : providers.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">No providers found.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Categories</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {providers.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {p.profiles?.full_name || p.business_name || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(p.service_categories ?? []).map((c) => (
                        <span
                          key={c}
                          className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(p.created_at)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => selectProvider(p)}
                      className="text-cobalt hover:underline text-sm font-medium cursor-pointer border-none bg-transparent"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Users Tab                                                          */
/* ------------------------------------------------------------------ */

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }

  async function saveRole(id: string) {
    await supabase.from("profiles").update({ role: editRole }).eq("id", id);
    setEditingId(null);
    loadUsers();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>

      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading...</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Name</th>
                <th className="px-4 py-3 font-medium text-gray-600">Role</th>
                <th className="px-4 py-3 font-medium text-gray-600">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{u.full_name || "—"}</p>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === u.id ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={editRole}
                          onChange={(e) => setEditRole(e.target.value)}
                          className="rounded-lg border border-gray-200 px-2 py-1 text-sm outline-none focus:border-cobalt"
                        >
                          <option value="client">client</option>
                          <option value="provider">provider</option>
                          <option value="admin">admin</option>
                        </select>
                        <button
                          onClick={() => saveRole(u.id)}
                          className="rounded bg-cobalt px-2 py-1 text-xs font-medium text-white hover:bg-cobalt-dark cursor-pointer border-none"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-600 cursor-pointer border-none bg-transparent"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      roleBadge(u.role)
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3">
                    {editingId !== u.id && (
                      <button
                        onClick={() => {
                          setEditingId(u.id);
                          setEditRole(u.role);
                        }}
                        className="text-cobalt hover:underline text-sm font-medium cursor-pointer border-none bg-transparent"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Jobs Tab                                                           */
/* ------------------------------------------------------------------ */

function JobsTab() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadJobs();
  }, [statusFilter, categoryFilter]);

  async function loadJobs() {
    setLoading(true);
    let query = supabase
      .from("jobs")
      .select("*, client:client_id(full_name), provider:provider_id(full_name)")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (categoryFilter !== "all") query = query.eq("category", categoryFilter);

    const { data } = await query;
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Jobs</h1>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cobalt"
          >
            <option value="all">All Status</option>
            <option value="searching">Searching</option>
            <option value="accepted">Accepted</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-cobalt"
          >
            <option value="all">All Categories</option>
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="cleaning">Cleaning</option>
          </select>
        </div>
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-gray-400">Loading...</p>
      ) : jobs.length === 0 ? (
        <p className="mt-8 text-center text-sm text-gray-400">No jobs found.</p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 font-medium text-gray-600">Client</th>
                <th className="px-4 py-3 font-medium text-gray-600">Provider</th>
                <th className="px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 font-medium text-gray-600">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {jobs.map((j) => (
                <tr key={j.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 capitalize font-medium text-gray-900">
                    {j.category}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {j.client?.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {j.provider?.full_name || "—"}
                  </td>
                  <td className="px-4 py-3">{statusBadge(j.status)}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(j.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Admin Dashboard                                               */
/* ------------------------------------------------------------------ */

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>("overview");
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-[#f9fafb] font-sans">
      <Sidebar active={tab} onSelect={setTab} />

      <main className="flex-1 overflow-y-auto p-8">
        <div className="mb-6 flex items-center justify-between">
          <div />
          <p className="text-sm text-gray-500">{user?.email}</p>
        </div>

        {tab === "overview" && <OverviewTab />}
        {tab === "providers" && <ProviderReviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "jobs" && <JobsTab />}
      </main>
    </div>
  );
}
