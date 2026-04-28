import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProviderJobs } from "../hooks/useProviderJobs";
import { useElapsedTime } from "../hooks/useElapsedTime";
import { ActiveJobCard } from "../components/job/ActiveJobCard";
import { RatingModal } from "../components/job/RatingModal";
import { JobListener } from "../components/provider/JobListener";
import { supabase } from "../lib/supabase";
import type { Job } from "../hooks/useJobs";
import {
  Wrench,
  Zap,
  Sparkles,
  Star,
  LogOut,
  CheckCircle,
  Clock,
  MapPin,
  Loader2,
  WifiOff,
  Calendar,
  ArrowLeft,
  Briefcase,
} from "lucide-react";

export function ProviderDashboard() {
  const { user, role, providerStatus } = useAuth();
  const { activeJob, scheduledJobs, advanceStatus, advanceJobStatus, submitReview, dismissCompletedJob } = useProviderJobs(user?.id);
  const elapsed = useElapsedTime(activeJob?.started_at ?? null);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [jobTab, setJobTab] = useState<"current" | "scheduled">("current");
  const [selectedScheduledJob, setSelectedScheduledJob] = useState<Job | null>(null);
  const selectedElapsed = useElapsedTime(selectedScheduledJob?.started_at ?? null);
  const [isOnline, setIsOnline] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // Load current online status on mount
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("provider_profiles")
      .select("is_online")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setIsOnline(data.is_online ?? false);
      });
  }, [user?.id]);

  const handleToggleOnline = async () => {
    if (!user?.id) return;
    setOnlineLoading(true);

    if (isOnline) {
      // Go offline
      await supabase
        .from("provider_profiles")
        .update({ is_online: false })
        .eq("id", user.id);
      setIsOnline(false);
      setLocationLabel(null);
    } else {
      // Go online — capture GPS first
      try {
        const coords = await new Promise<GeolocationCoordinates>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(
            (p) => resolve(p.coords),
            reject,
            { timeout: 10000, maximumAge: 60000 }
          )
        );
        const point = `SRID=4326;POINT(${coords.longitude} ${coords.latitude})`;
        await supabase
          .from("provider_profiles")
          .update({ is_online: true, live_location: point })
          .eq("id", user.id);
        setIsOnline(true);
        setLocationLabel(`${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
      } catch {
        // If GPS denied, go online without location
        await supabase
          .from("provider_profiles")
          .update({ is_online: true })
          .eq("id", user.id);
        setIsOnline(true);
        setLocationLabel(null);
      }
    }

    setOnlineLoading(false);
  };

  // When a selected scheduled job moves out of scheduledJobs (started), switch to current tab
  useEffect(() => {
    if (!selectedScheduledJob) return;
    const stillScheduled = scheduledJobs.find((j) => j.id === selectedScheduledJob.id);
    if (!stillScheduled) {
      setSelectedScheduledJob(null);
      setJobTab("current");
    }
  }, [scheduledJobs, selectedScheduledJob]);

  // Live stats
  const [completedCount, setCompletedCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    async function fetchStats() {
      // Completed jobs count
      const { count: completed } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", user!.id)
        .eq("status", "completed");
      setCompletedCount(completed ?? 0);

      // Cancelled jobs count
      const { count: cancelled } = await supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("provider_id", user!.id)
        .eq("status", "cancelled");
      setCancelledCount(cancelled ?? 0);

      // Average rating from reviews
      const { data: reviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewee_id", user!.id);
      const ratings = reviews ?? [];
      if (ratings.length > 0) {
        const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
        setAvgRating(Math.round(avg * 10) / 10);
      } else {
        setAvgRating(null);
      }
    }

    fetchStats();
  }, [user?.id, activeJob?.status]); // re-fetch when job status changes

  return (
    <JobListener>
    <div className="min-h-screen bg-[#f9fafb] font-sans">
      {/* ── Top Bar ───────────────────────────────────── */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-xl font-extrabold tracking-tight text-cobalt no-underline">
            fix<span className="text-gray-900">match</span>
          </Link>
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

        {/* Online / Offline Toggle */}
        {providerStatus === "approved" && (
          <div className={`mt-6 rounded-2xl border p-5 flex items-center justify-between gap-4 transition-all ${
            isOnline
              ? "bg-emerald-50 border-emerald-200"
              : "bg-white border-gray-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isOnline ? "bg-emerald-100" : "bg-gray-100"
              }`}>
                {isOnline
                  ? <MapPin size={18} className="text-emerald-600" />
                  : <WifiOff size={18} className="text-gray-400" />
                }
              </div>
              <div>
                <p className={`font-semibold text-sm ${isOnline ? "text-emerald-800" : "text-gray-700"}`}>
                  {isOnline ? "You are Online" : "You are Offline"}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {isOnline
                    ? locationLabel
                      ? `Location recorded · ${locationLabel}`
                      : "Visible to clients — location not recorded"
                    : "Go online to receive job requests"}
                </p>
              </div>
            </div>

            <button
              onClick={handleToggleOnline}
              disabled={onlineLoading}
              className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition cursor-pointer border-none disabled:opacity-60 ${
                isOnline
                  ? "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
                  : "bg-cobalt text-white hover:bg-cobalt-dark shadow-sm shadow-cobalt/30"
              }`}
            >
              {onlineLoading
                ? <><Loader2 size={15} className="animate-spin" /> Working…</>
                : isOnline ? "Go Offline" : "Go Online"
              }
            </button>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "Jobs Completed",
              value: String(completedCount),
              icon: CheckCircle,
              bg: "bg-emerald-50",
              iconColor: "text-emerald-500",
            },
            {
              label: "Avg Rating",
              value: avgRating !== null ? `${avgRating} ★` : "N/A",
              icon: Star,
              bg: "bg-amber-50",
              iconColor: "text-amber-500",
            },
            {
              label: "Cancellations",
              value: String(cancelledCount),
              icon: Clock,
              bg: "bg-red-50",
              iconColor: "text-red-400",
            },
          ].map((stat) => (
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

        {/* Jobs section with tabs */}
        <div className="mt-10">
          {/* Tab headers */}
          <div className="flex items-center gap-1 rounded-xl bg-gray-100 p-1 w-fit">
            <button
              onClick={() => setJobTab("current")}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer border-none ${
                jobTab === "current"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Current Job
            </button>
            <button
              onClick={() => setJobTab("scheduled")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition cursor-pointer border-none ${
                jobTab === "scheduled"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "bg-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Scheduled
              {scheduledJobs.length > 0 && (
                <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                  jobTab === "scheduled" ? "bg-cobalt text-white" : "bg-cobalt/20 text-cobalt"
                }`}>
                  {scheduledJobs.length}
                </span>
              )}
            </button>
          </div>

          {/* Current Job tab */}
          {jobTab === "current" && (
            <>
              {activeJob && activeJob.status !== "completed" ? (
                <ActiveJobCard job={activeJob} onAdvance={advanceStatus} elapsed={elapsed} />
              ) : activeJob && activeJob.status === "completed" ? (
                <RatingModal
                  roleLabel="your client"
                  submitting={reviewSubmitting}
                  onSubmit={async (rating, comment) => {
                    setReviewSubmitting(true);
                    await submitReview(rating, comment);
                    setReviewSubmitting(false);
                    dismissCompletedJob();
                  }}
                  onDismiss={dismissCompletedJob}
                />
              ) : (
                <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <Clock size={32} className="mx-auto text-gray-300" />
                  <h3 className="mt-4 font-semibold text-gray-400">No incoming jobs yet</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    When a client requests your service, it will appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Scheduled tab */}
          {jobTab === "scheduled" && (
            <>
              {selectedScheduledJob ? (
                <div className="mt-4">
                  <button
                    onClick={() => setSelectedScheduledJob(null)}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-cobalt transition cursor-pointer bg-transparent border-none mb-4"
                  >
                    <ArrowLeft size={15} /> Back to scheduled
                  </button>
                  <ActiveJobCard
                    job={selectedScheduledJob}
                    onAdvance={(ns) => advanceJobStatus(selectedScheduledJob.id, ns)}
                    elapsed={selectedElapsed}
                  />
                </div>
              ) : scheduledJobs.length === 0 ? (
                <div className="mt-4 rounded-xl border-2 border-dashed border-gray-200 p-10 text-center">
                  <Calendar size={32} className="mx-auto text-gray-300" />
                  <h3 className="mt-4 font-semibold text-gray-400">No scheduled jobs</h3>
                  <p className="mt-1 text-sm text-gray-400">
                    Accepted scheduled jobs will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  {scheduledJobs.map((job) => (
                    <button
                      key={job.id}
                      onClick={() => setSelectedScheduledJob(job)}
                      className="w-full text-left rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-cobalt/30 hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cobalt/10 shrink-0">
                          <Briefcase size={20} className="text-cobalt" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 capitalize">{job.category}</p>
                            <span className="rounded-full bg-cobalt/10 px-2 py-0.5 text-xs font-semibold text-cobalt">
                              Scheduled
                            </span>
                          </div>
                          {job.description && (
                            <p className="mt-0.5 text-sm text-gray-500 truncate">{job.description}</p>
                          )}
                        </div>
                      </div>
                      {job.scheduled_at && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-cobalt/5 px-3 py-2">
                          <Calendar size={14} className="text-cobalt shrink-0" />
                          <span className="text-sm font-semibold text-cobalt">
                            {new Date(job.scheduled_at).toLocaleString(undefined, {
                              weekday: "short", month: "short", day: "numeric",
                              hour: "numeric", minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
    </JobListener>
  );
}

/* ── Data ───────────────────────────────────────── */


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
