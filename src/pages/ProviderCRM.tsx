import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useProviderCRM } from "../hooks/useProviderCRM";
import { JobListener } from "../components/provider/JobListener";
import { supabase } from "../lib/supabase";
import {
  Users, Search, Star, Briefcase, LogOut, ChevronRight,
  ArrowLeft, Phone, Calendar, Tag, X, Plus, FileText,
  Check, LayoutDashboard,
} from "lucide-react";

const PRESET_TAGS = ["VIP", "Regular", "Repeat", "New", "Priority", "Do Not Rebook"];

const STATUS_STYLES: Record<string, string> = {
  completed:   "bg-emerald-100 text-emerald-700",
  cancelled:   "bg-red-100 text-red-600",
  in_progress: "bg-provider/10 text-provider",
  matched:     "bg-blue-100 text-blue-700",
  en_route:    "bg-amber-100 text-amber-700",
  arrived:     "bg-purple-100 text-purple-700",
};

const CATEGORY_EMOJI: Record<string, string> = {
  plumbing: "🔧",
  electrical: "⚡",
  cleaning: "✨",
};

export function ProviderCRM() {
  const { user, role } = useAuth();
  const { clients, loading, jobs, reviews, ensureRelationship, updateNotes, updateTags } =
    useProviderCRM(user?.id);

  const [search, setSearch]         = useState("");
  const [filterTag, setFilterTag]   = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab]               = useState<"jobs" | "reviews">("jobs");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [customTag, setCustomTag]   = useState("");
  const [notesVal, setNotesVal]     = useState("");
  const [notesSynced, setNotesSynced] = useState(true);
  const noteTimer = useRef<ReturnType<typeof setTimeout>>();

  const selected       = clients.find((c) => c.id === selectedId) ?? null;
  const selectedJobs   = selectedId ? (jobs[selectedId]    ?? []) : [];
  const selectedReviews = selectedId ? (reviews[selectedId] ?? []) : [];
  const allUsedTags    = [...new Set(clients.flatMap((c) => c.tags))].sort();
  const totalJobs      = clients.reduce((s, c) => s + c.job_count, 0);
  const totalCompleted = clients.reduce((s, c) => s + c.completed_count, 0);

  const visible = clients.filter((c) => {
    const nameOk = c.full_name.toLowerCase().includes(search.toLowerCase());
    const tagOk  = !filterTag || c.tags.includes(filterTag);
    return nameOk && tagOk;
  });

  // Sync notes textarea when switching clients
  useEffect(() => {
    if (selected) {
      setNotesVal(selected.notes);
      setNotesSynced(true);
      setShowTagPicker(false);
      setTab("jobs");
    }
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSelect(clientId: string) {
    setSelectedId(clientId);
    await ensureRelationship(clientId);
  }

  function handleNotesChange(val: string) {
    setNotesVal(val);
    setNotesSynced(false);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(async () => {
      await updateNotes(selectedId!, val);
      setNotesSynced(true);
    }, 800);
  }

  async function handleAddTag(tag: string) {
    const t = tag.trim();
    if (!t || !selected || selected.tags.includes(t)) return;
    await updateTags(selected.id, [...selected.tags, t]);
    setCustomTag("");
    setShowTagPicker(false);
  }

  async function handleRemoveTag(tag: string) {
    if (!selected) return;
    await updateTags(selected.id, selected.tags.filter((t) => t !== tag));
  }

  return (
    <JobListener>
      <div className="min-h-screen bg-[#f0fdfa] font-sans">

        {/* ── Nav ──────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-provider/15 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3.5">
            <div className="flex items-center gap-5">
              <Link to="/" className="text-xl font-extrabold tracking-tight text-provider no-underline">
                fix<span className="text-gray-900">match</span>
              </Link>
              <div className="hidden md:flex items-center gap-0.5">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:text-provider hover:bg-provider/5 transition no-underline"
                >
                  <LayoutDashboard size={14} /> Dashboard
                </Link>
                <Link
                  to="/crm"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-provider bg-provider/10 transition no-underline"
                >
                  <Users size={14} /> Clients
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-gray-400 sm:inline">{user?.email}</span>
              <span className="rounded-full bg-provider/10 px-3 py-1 text-xs font-semibold text-provider capitalize">
                {role}
              </span>
              <button
                onClick={() => supabase.auth.signOut()}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition cursor-pointer"
              >
                <LogOut size={14} /> Sign Out
              </button>
            </div>
          </div>
        </nav>

        {/* ── Page header ──────────────────────────────── */}
        <div className="mx-auto max-w-7xl px-6 pt-7 pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-provider/10">
              <Users size={22} className="text-provider" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Clients</h1>
              <p className="text-sm text-gray-500">
                {clients.length} client{clients.length !== 1 ? "s" : ""} · {totalJobs} total jobs · {totalCompleted} completed
              </p>
            </div>
          </div>
        </div>

        {/* ── Two-column layout ────────────────────────── */}
        <div className="mx-auto max-w-7xl px-6 pb-10">
          <div className="flex gap-5" style={{ height: "calc(100vh - 204px)" }}>

            {/* ── Left: client list ─────────────────────── */}
            <div className={`flex-col w-full lg:w-[300px] shrink-0 gap-3 ${selectedId ? "hidden lg:flex" : "flex"}`}>

              {/* Search */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search clients…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-provider focus:ring-2 focus:ring-provider/15 transition"
                />
              </div>

              {/* Tag filter chips */}
              {allUsedTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setFilterTag(null)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border-none cursor-pointer transition ${
                      !filterTag ? "bg-provider text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-provider/30"
                    }`}
                  >
                    All
                  </button>
                  {allUsedTags.map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTag(filterTag === t ? null : t)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border-none cursor-pointer transition ${
                        filterTag === t ? "bg-provider text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-provider/30"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              )}

              {/* Client cards */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                {loading ? (
                  <p className="py-10 text-center text-sm text-gray-400">Loading clients…</p>
                ) : visible.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users size={32} className="mx-auto text-gray-200" />
                    <p className="mt-3 text-sm text-gray-400">
                      {search || filterTag ? "No matches" : "No clients yet — jobs you complete will appear here."}
                    </p>
                  </div>
                ) : (
                  visible.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className={`w-full text-left rounded-2xl border p-4 bg-white transition cursor-pointer ${
                        selectedId === c.id
                          ? "border-provider shadow-sm shadow-provider/10 ring-1 ring-provider/20"
                          : "border-gray-200 hover:border-provider/30 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 shrink-0 rounded-full bg-provider/10 flex items-center justify-center text-sm font-bold text-provider overflow-hidden">
                          {c.avatar_url
                            ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" />
                            : c.full_name.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{c.full_name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {c.job_count} job{c.job_count !== 1 ? "s" : ""}
                            {c.avg_rating !== null && <> · ★ {c.avg_rating}</>}
                          </p>
                        </div>
                        <ChevronRight size={14} className="text-gray-300 shrink-0" />
                      </div>
                      {c.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {c.tags.map((tag) => (
                            <span key={tag} className="rounded-full bg-provider/10 px-2 py-0.5 text-xs font-semibold text-provider">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* ── Right: detail panel ───────────────────── */}
            <div className={`flex-1 min-w-0 overflow-hidden ${selectedId ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
              {!selected ? (
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                  <Users size={40} className="text-gray-200" />
                  <p className="mt-4 text-sm font-medium text-gray-300">Select a client to view details</p>
                </div>
              ) : (
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

                  {/* Client header */}
                  <div className="border-b border-gray-100 p-5 shrink-0">

                    {/* Mobile back */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="lg:hidden flex items-center gap-1.5 text-sm font-medium text-gray-400 hover:text-provider mb-3 cursor-pointer bg-transparent border-none transition"
                    >
                      <ArrowLeft size={14} /> All clients
                    </button>

                    {/* Profile row */}
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 shrink-0 rounded-2xl bg-provider/10 flex items-center justify-center text-xl font-bold text-provider overflow-hidden">
                        {selected.avatar_url
                          ? <img src={selected.avatar_url} alt="" className="h-full w-full object-cover" />
                          : selected.full_name.charAt(0).toUpperCase()
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-bold text-gray-900 truncate">{selected.full_name}</h2>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                          {selected.phone && (
                            <span className="flex items-center gap-1.5">
                              <Phone size={13} /> {selected.phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5">
                            <Briefcase size={13} />
                            {selected.job_count} job{selected.job_count !== 1 ? "s" : ""}
                            {selected.completed_count > 0 && ` (${selected.completed_count} completed)`}
                          </span>
                          {selected.avg_rating !== null && (
                            <span className="flex items-center gap-1 text-amber-500 font-semibold">
                              <Star size={13} fill="currentColor" /> {selected.avg_rating}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="mt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Tag size={13} className="text-gray-300 shrink-0" />
                        {selected.tags.map((tag) => (
                          <span key={tag} className="flex items-center gap-1 rounded-full bg-provider/10 pl-3 pr-1.5 py-1 text-xs font-semibold text-provider">
                            {tag}
                            <button
                              onClick={() => handleRemoveTag(tag)}
                              className="hover:text-red-500 cursor-pointer bg-transparent border-none p-0 leading-none transition"
                            >
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                        <button
                          onClick={() => setShowTagPicker(!showTagPicker)}
                          className="flex items-center gap-1 rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-400 hover:border-provider hover:text-provider transition cursor-pointer bg-transparent"
                        >
                          <Plus size={11} /> Add tag
                        </button>
                      </div>

                      {showTagPicker && (
                        <div className="mt-2 rounded-xl border border-gray-200 bg-gray-50 p-3">
                          {PRESET_TAGS.filter((t) => !selected.tags.includes(t)).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                              {PRESET_TAGS.filter((t) => !selected.tags.includes(t)).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => handleAddTag(t)}
                                  className="rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-provider/10 hover:text-provider hover:border-provider/20 transition cursor-pointer"
                                >
                                  + {t}
                                </button>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              placeholder="Custom tag…"
                              value={customTag}
                              onChange={(e) => setCustomTag(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleAddTag(customTag);
                                if (e.key === "Escape") { setShowTagPicker(false); setCustomTag(""); }
                              }}
                              className="flex-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-provider focus:ring-1 focus:ring-provider/15"
                            />
                            <button
                              onClick={() => handleAddTag(customTag)}
                              disabled={!customTag.trim()}
                              className="rounded-lg bg-provider px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40 cursor-pointer border-none"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          <FileText size={12} /> Private notes
                        </span>
                        <span className="text-xs">
                          {!notesSynced
                            ? <span className="text-gray-400">Saving…</span>
                            : notesVal
                              ? <span className="flex items-center gap-1 text-emerald-500"><Check size={11} /> Saved</span>
                              : null
                          }
                        </span>
                      </div>
                      <textarea
                        value={notesVal}
                        onChange={(e) => handleNotesChange(e.target.value)}
                        placeholder="Add private notes about this client — only you can see these."
                        rows={2}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-provider focus:ring-2 focus:ring-provider/10 resize-none transition placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-100 px-5 shrink-0">
                    <div className="flex">
                      {(
                        [
                          { id: "jobs",    label: "Job History", count: selectedJobs.length,    icon: Briefcase },
                          { id: "reviews", label: "Reviews",     count: selectedReviews.length, icon: Star },
                        ] as const
                      ).map(({ id, label, count, icon: Icon }) => (
                        <button
                          key={id}
                          onClick={() => setTab(id)}
                          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition cursor-pointer bg-transparent border-x-0 border-t-0 ${
                            tab === id
                              ? "border-b-provider text-provider"
                              : "border-b-transparent text-gray-400 hover:text-gray-700"
                          }`}
                        >
                          <Icon size={14} />
                          {label}
                          {count > 0 && (
                            <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${
                              tab === id ? "bg-provider/10 text-provider" : "bg-gray-100 text-gray-400"
                            }`}>
                              {count}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tab content */}
                  <div className="flex-1 overflow-y-auto p-5">

                    {tab === "jobs" && (
                      <div className="space-y-3">
                        {selectedJobs.length === 0 ? (
                          <p className="py-10 text-center text-sm text-gray-400">No jobs with this client yet.</p>
                        ) : selectedJobs.map((job) => (
                          <div key={job.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <span className="text-xl leading-none">{CATEGORY_EMOJI[job.category] ?? "🔧"}</span>
                                <div>
                                  <p className="font-semibold text-gray-900 capitalize">{job.category}</p>
                                  {job.description && (
                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{job.description}</p>
                                  )}
                                </div>
                              </div>
                              <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                                STATUS_STYLES[job.status] ?? "bg-gray-100 text-gray-600"
                              }`}>
                                {job.status.replace(/_/g, " ")}
                              </span>
                            </div>
                            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                              <span className="flex items-center gap-1">
                                <Calendar size={11} />
                                {new Date(job.created_at).toLocaleDateString(undefined, {
                                  month: "short", day: "numeric", year: "numeric",
                                })}
                              </span>
                              {job.completed_at && (
                                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                                  <Check size={11} />
                                  Done {new Date(job.completed_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              )}
                              {job.scheduled_at && job.status !== "completed" && (
                                <span className="flex items-center gap-1 text-provider font-medium">
                                  <Calendar size={11} />
                                  Scheduled {new Date(job.scheduled_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {tab === "reviews" && (
                      <div className="space-y-3">
                        {selectedReviews.length === 0 ? (
                          <p className="py-10 text-center text-sm text-gray-400">No reviews from this client yet.</p>
                        ) : selectedReviews.map((review) => (
                          <div key={review.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                            <div className="flex items-center gap-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  size={16}
                                  className={i < review.rating ? "text-amber-400" : "text-gray-200"}
                                  fill="currentColor"
                                />
                              ))}
                              <span className="ml-2 text-sm font-bold text-gray-700">{review.rating} / 5</span>
                            </div>
                            {review.comment && (
                              <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">"{review.comment}"</p>
                            )}
                            <p className="mt-2.5 text-xs text-gray-400">
                              {new Date(review.created_at).toLocaleDateString(undefined, {
                                month: "long", day: "numeric", year: "numeric",
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </JobListener>
  );
}
