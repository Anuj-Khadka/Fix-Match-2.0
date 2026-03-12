import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";
import {
  Wrench,
  Zap,
  Sparkles,
  Star,
  LogOut,
  CheckCircle,
  Clock,
} from "lucide-react";

export function ProviderDashboard() {
  const { user, role, providerStatus } = useAuth();

  return (
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      {/* ── Top Bar ───────────────────────────────────── */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-extrabold tracking-tight text-cobalt">
            fix<span className="text-gray-900">match</span>
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-gray-500 sm:inline">
              {user?.email}
            </span>
            <span className="rounded-full bg-cobalt/10 px-3 py-1 text-xs font-semibold text-cobalt capitalize">
              {role}
            </span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 transition hover:bg-gray-50 cursor-pointer"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* ── Main Content ──────────────────────────────── */}
      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-cobalt to-orange-600 p-8 text-white shadow-lg shadow-cobalt/20">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Star size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                Welcome to Fixmatch
              </h1>
              <p className="mt-1 text-orange-100">
                Your service is valued here.
              </p>
            </div>
          </div>

          {/* Status indicator */}
          <div className="mt-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
            {providerStatus === "approved" ? (
              <>
                <CheckCircle size={18} className="text-emerald-300" />
                <span className="text-sm font-medium">
                  Your account is approved — you're ready to accept jobs.
                </span>
              </>
            ) : (
              <>
                <Clock size={18} className="text-amber-300" />
                <span className="text-sm font-medium">
                  Your account is under review. We'll notify you once approved.
                </span>
              </>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon size={20} className={stat.iconColor} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Service Categories */}
        <div className="mt-10">
          <h2 className="text-lg font-semibold">Your Service Categories</h2>
          <p className="mt-1 text-sm text-gray-500">
            Jobs in these categories will be matched to you.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.title}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${cat.bg}`}>
                  <cat.icon size={22} className={cat.iconColor} />
                </div>
                <div>
                  <p className="font-medium">{cat.title}</p>
                  <p className="text-xs text-gray-400">{cat.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Jobs Placeholder */}
        <div className="mt-10 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
          <Clock size={32} className="mx-auto text-gray-300" />
          <h3 className="mt-4 font-semibold text-gray-400">No incoming jobs yet</h3>
          <p className="mt-1 text-sm text-gray-400">
            When a client requests your service, it will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}

/* ── Data ───────────────────────────────────────── */

const STATS = [
  {
    label: "Jobs Completed",
    value: "0",
    icon: CheckCircle,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    label: "Reliability Score",
    value: "5.0",
    icon: Star,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    label: "Cancellations",
    value: "0",
    icon: Clock,
    bg: "bg-red-50",
    iconColor: "text-red-400",
  },
];

const CATEGORIES = [
  {
    title: "Plumbing",
    subtitle: "Pipes, faucets, drains",
    icon: Wrench,
    bg: "bg-orange-50",
    iconColor: "text-cobalt",
  },
  {
    title: "Electrical",
    subtitle: "Wiring, outlets, panels",
    icon: Zap,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    title: "Cleaning",
    subtitle: "Deep cleans, recurring",
    icon: Sparkles,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
];
