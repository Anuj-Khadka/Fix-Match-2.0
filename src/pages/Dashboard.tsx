import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wrench,
  Zap,
  Sparkles,
  MoreHorizontal,
  LogOut,
  Wallet,
  Settings,
  MapPin,
  Loader2,
  ArrowRight,
  Clock,
  ShieldCheck,
  CreditCard,
  Search,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useGeolocation } from "../hooks/useGeolocation";
import { useJobs, type JobCategory } from "../hooks/useJobs";
import { supabase } from "../lib/supabase";

/* ------------------------------------------------------------------ */
/*  Category config                                                     */
/* ------------------------------------------------------------------ */

const CATEGORIES: {
  value: JobCategory | "more";
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}[] = [
  { value: "plumbing",    label: "Plumbing",   desc: "Pipes & fixtures",  Icon: Wrench,        color: "text-cobalt",     bg: "bg-orange-50" },
  { value: "electrical",  label: "Electrical", desc: "Wiring & panels",   Icon: Zap,           color: "text-yellow-500", bg: "bg-yellow-50" },
  { value: "cleaning",    label: "Cleaning",   desc: "Home & office",     Icon: Sparkles,      color: "text-emerald-600",bg: "bg-emerald-50"},
  { value: "more",        label: "More",       desc: "Coming soon",       Icon: MoreHorizontal,color: "text-gray-400",   bg: "bg-gray-100"  },
];

/* ------------------------------------------------------------------ */
/*  Dashboard                                                           */
/* ------------------------------------------------------------------ */

export function Dashboard() {
  const { user } = useAuth();
  const { requestPosition, loading: geoLoading, error: geoError } = useGeolocation();
  const jobs = useJobs(user?.id);

  const [selectedCategory, setSelectedCategory] = useState<JobCategory | null>(null);
  const [address, setAddress] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  /* ── Handlers ─────────────────────────────────────────────────── */
  async function handleFindPro() {
    if (!selectedCategory) return;
    try {
      const coords = await requestPosition();
      // Reverse-geocode to show the address to the user
      fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`)
        .then((r) => r.json())
        .then((d) => {
          const a = d.address ?? {};
          const street = [a.house_number, a.road].filter(Boolean).join(" ");
          const city   = a.city ?? a.town ?? a.village ?? "";
          setAddress([street, city].filter(Boolean).join(", ") || "Current Location");
        })
        .catch(() => setAddress("Current Location"));
      await jobs.createJob({ category: selectedCategory, ...coords });
    } catch {
      // errors surfaced via geoError / jobs.error
    }
  }

  const handleSignOut = () => {
    setDropdownOpen(false);
    supabase.auth.signOut();
  };

  const userInitial = (user?.email?.[0] ?? "U").toUpperCase();
  const isSearching  = !!jobs.activeJob;
  const isBusy       = geoLoading || jobs.loading;

  /* ── Render ───────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">

      {/* ════════════════════════════════════════════════════════════
          GLASS NAVBAR
      ════════════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          {/* Logo */}
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-cobalt select-none no-underline">
            fix<span className="text-gray-900">match</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden items-center gap-6 md:flex">
            <a href="#services" className="text-sm font-medium text-gray-600 transition hover:text-cobalt">
              Browse Services
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-cobalt">
              Safety
            </a>
            <a href="#" className="text-sm font-medium text-gray-600 transition hover:text-cobalt">
              Help
            </a>
          </div>

          {/* Avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2.5 hover:opacity-80 transition cursor-pointer border-none bg-transparent"
            >
              <div className="w-9 h-9 rounded-full bg-cobalt text-white text-sm font-bold flex items-center justify-center select-none shrink-0">
                {userInitial}
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 leading-none">
                {user?.email?.split("@")[0]}
              </span>
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  <div className="px-4 py-3 bg-slate-50 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-800">My Account</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                  </div>
                  <div className="py-1.5">
                    {[{ Icon: Wallet, label: "Wallet" }, { Icon: Settings, label: "Settings" }].map(
                      ({ Icon, label }) => (
                        <button
                          key={label}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-slate-50 cursor-pointer border-none bg-transparent text-left transition"
                        >
                          <Icon size={15} className="text-gray-400" />
                          {label}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="border-t border-gray-100 py-1.5">
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 cursor-pointer border-none bg-transparent transition"
                    >
                      <LogOut size={15} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ════════════════════════════════════════════════════════════
          HERO  (same gradient + blobs as landing page)
      ════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff7f3] via-white to-[#fafaf8] pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cobalt/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-[400px] w-[400px] rounded-full bg-orange-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full bg-cobalt/10 px-4 py-1.5 text-xs font-semibold text-cobalt mb-6">
            <Zap size={14} /> Now live in your city
          </div>

          {/* Headline */}
          <h1
            className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
            style={{ animation: "fade-in-up 0.7s ease-out both" }}
          >
            Professional Help,{" "}
            <span className="bg-gradient-to-r from-cobalt to-orange-400 bg-clip-text text-transparent">
              at Your Door
            </span>{" "}
            in Minutes.
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-gray-500 sm:text-xl"
            style={{ animation: "fade-in-up 0.7s ease-out 0.15s both" }}
          >
            The first direct-connect marketplace for plumbing, electrical, and
            home repair. No agencies, no waiting.
          </p>

          {/* ── Active Job Banner ── */}
          {isSearching && (
            <div
              className="mx-auto mt-10 max-w-xl rounded-2xl bg-white border border-cobalt/20 shadow-xl shadow-cobalt/10 p-5 flex items-center gap-4 text-left"
              style={{ animation: "fade-in-up 0.4s ease-out both" }}
            >
              <div className="relative w-12 h-12 shrink-0">
                <div className="absolute inset-0 rounded-full border-2 border-cobalt animate-ping opacity-30" />
                <div className="absolute inset-1 rounded-full border-2 border-cobalt opacity-20" />
                <div className="absolute inset-3 rounded-full bg-cobalt" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900">Searching for nearby Pros…</p>
                <p className="text-sm text-gray-500 mt-0.5 capitalize">
                  {jobs.activeJob!.category}&nbsp;·&nbsp;
                  <span className={jobs.activeJob!.status === "accepted" ? "text-green-600 font-semibold" : "text-orange-500 font-semibold"}>
                    {jobs.activeJob!.status}
                  </span>
                  {address && <span className="ml-2 text-gray-400">· {address}</span>}
                </p>
              </div>
              <button
                onClick={jobs.cancelJob}
                disabled={jobs.loading}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-100 transition cursor-pointer disabled:opacity-40 shrink-0"
              >
                {jobs.loading ? <Loader2 size={15} className="animate-spin" /> : "Cancel"}
              </button>
            </div>
          )}

          {/* ── Service Selector ── */}
          {!isSearching && (
            <div
              className="mx-auto mt-10 max-w-xl"
              style={{ animation: "fade-in-up 0.7s ease-out 0.3s both" }}
            >
              {/* Address indicator (after geo resolves) */}
              {address && (
                <div className="flex items-center justify-center gap-1.5 mb-4 text-sm text-gray-500">
                  <MapPin size={14} className="text-cobalt" />
                  <span>{address}</span>
                </div>
              )}

              {/* 2×2 category cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                {CATEGORIES.map(({ value, label, desc, Icon, color, bg }) => {
                  const isMore = value === "more";
                  const active = !isMore && selectedCategory === value;
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        !isMore &&
                        setSelectedCategory((v) => (v === value ? null : (value as JobCategory)))
                      }
                      disabled={isMore}
                      className={`
                        flex flex-col items-center gap-2.5 rounded-2xl border-2 py-5 px-3
                        transition-all duration-150 cursor-pointer bg-white
                        ${isMore ? "opacity-40 cursor-not-allowed border-gray-100" : ""}
                        ${!isMore && active
                          ? "border-cobalt bg-cobalt/5 shadow-lg shadow-cobalt/10 scale-[.97]"
                          : !isMore
                          ? "border-gray-200 hover:border-cobalt/40 hover:shadow-md hover:-translate-y-0.5"
                          : ""}
                      `}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${active ? "bg-cobalt" : bg}`}>
                        <Icon size={19} className={active ? "text-white" : color} />
                      </div>
                      <div className="text-center">
                        <p className={`text-sm font-semibold leading-none ${active ? "text-cobalt" : "text-gray-800"}`}>
                          {label}
                        </p>
                        <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Errors */}
              {(geoError || jobs.error) && (
                <p className="text-sm text-red-600 mb-4 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
                  {geoError || jobs.error}
                </p>
              )}

              {/* Find a Pro CTA */}
              <button
                onClick={handleFindPro}
                disabled={!selectedCategory || isBusy}
                className="
                  w-full flex items-center justify-center gap-2
                  rounded-2xl bg-cobalt py-4 text-base font-semibold text-white
                  shadow-lg shadow-cobalt/25 transition
                  hover:bg-cobalt-dark hover:scale-[1.02] active:scale-[.98]
                  disabled:opacity-40 cursor-pointer border-none
                "
              >
                {geoLoading ? (
                  <><Loader2 size={18} className="animate-spin" /> Getting your location…</>
                ) : jobs.loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Creating request…</>
                ) : (
                  <>Find a Pro <ArrowRight size={18} /></>
                )}
              </button>
            </div>
          )}

          {/* Social proof badges */}
          <div
            className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-gray-400"
            style={{ animation: "fade-in-up 0.7s ease-out 0.45s both" }}
          >
            <span className="flex items-center gap-1">
              <ShieldCheck size={16} className="text-emerald-500" /> Background-checked pros
            </span>
            <span className="flex items-center gap-1">
              <Clock size={16} className="text-cobalt" /> Average response: 4 min
            </span>
            <span className="flex items-center gap-1">
              <CreditCard size={16} className="text-amber-500" /> Pay only when satisfied
            </span>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          BROWSE SERVICES  — photo card grid
      ════════════════════════════════════════════════════════════ */}
      <section id="services" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">

          {/* Two-column heading */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
            <h2 className="max-w-lg text-4xl font-extrabold leading-[1.15] tracking-tight text-gray-900 sm:text-5xl">
              Find the right{" "}
              <span className="relative inline-block">
                Service
                {/* Wavy cobalt underline */}
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  height="10"
                  viewBox="0 0 120 10"
                  preserveAspectRatio="none"
                  fill="none"
                >
                  <path
                    d="M0,7 C20,1 40,9 60,4 C80,-1 100,8 120,5"
                    stroke="#FF6B35"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <br />for Your Home
            </h2>
            <p className="max-w-xs text-base text-gray-500 md:text-right leading-relaxed">
              For repairs or renovations, the right service matters. Fixmatch
              connects you with verified pros for quality and reliability,
              keeping your home in shape.
            </p>
          </div>

          {/* 3×2 photo card grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PHOTO_SERVICES.map((s) => (
              <button
                key={s.title}
                onClick={
                  s.bookable
                    ? () => {
                        setSelectedCategory(s.value as JobCategory);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }
                    : undefined
                }
                className={`group flex flex-col rounded-2xl bg-[#f4f4f4] overflow-hidden text-left transition-all
                  ${s.bookable ? "cursor-pointer hover:shadow-xl hover:scale-[1.01] active:scale-[.99]" : "cursor-default"}`}
              >
                {/* Card title row */}
                <div className="flex items-center justify-between px-5 py-4">
                  <h3 className="font-semibold text-[15px] text-gray-900">{s.title}</h3>
                  {s.featured ? (
                    <ArrowRight
                      size={17}
                      className="text-cobalt -rotate-45 shrink-0"
                    />
                  ) : (
                    <ArrowRight
                      size={17}
                      className={`shrink-0 transition ${s.bookable ? "text-gray-400 group-hover:text-cobalt group-hover:translate-x-0.5" : "text-gray-300"}`}
                    />
                  )}
                </div>

                {/* Photo */}
                <div className="relative mx-3 mb-3 rounded-xl overflow-hidden h-48">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />

                  {/* Optional badge */}
                  {s.badge && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-gray-900/75 backdrop-blur-sm rounded-full px-3 py-1.5">
                      <span className="text-[11px] font-semibold text-green-400">
                        From {s.badge.price}
                      </span>
                      <span className="w-px h-3 bg-gray-500" />
                      <span className="text-yellow-400 text-[11px]">★</span>
                      <span className="text-[11px] font-semibold text-white">
                        {s.badge.rating}
                      </span>
                    </div>
                  )}

                  {/* Coming soon pill */}
                  {!s.bookable && (
                    <div className="absolute top-3 right-3 bg-gray-900/60 backdrop-blur-sm rounded-full px-2.5 py-1">
                      <span className="text-[10px] font-semibold text-white tracking-wide uppercase">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════════════ */}
      <section className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps. <span className="text-cobalt">That's it.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              From request to doorbell in minutes.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
            {HOW_IT_WORKS.map((step, i) => (
              <div
                key={step.title}
                className="relative text-center"
                style={{ animation: `fade-in-up 0.5s ease-out ${0.15 * i}s both` }}
              >
                <div
                  className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cobalt/10"
                  style={{ animation: "float 3s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}
                >
                  <step.Icon size={28} className="text-cobalt" />
                </div>
                {i < HOW_IT_WORKS.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+40px)] hidden h-[2px] w-[calc(100%-80px)] bg-gradient-to-r from-cobalt/30 to-cobalt/5 md:block" />
                )}
                <span className="mt-5 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                  STEP {i + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Static data                                                         */
/* ------------------------------------------------------------------ */

const PHOTO_SERVICES: {
  title: string;
  value: string;
  bookable: boolean;
  featured: boolean;
  image: string;
  badge: { price: string; rating: string } | null;
}[] = [
  {
    title: "Plumbing & Leak Repairs",
    value: "plumbing",
    bookable: true,
    featured: false,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    badge: null,
  },
  {
    title: "Electrical Services",
    value: "electrical",
    bookable: true,
    featured: false,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80",
    badge: null,
  },
  {
    title: "Home Cleaning",
    value: "cleaning",
    bookable: true,
    featured: true,
    image: "https://images.unsplash.com/photo-1527515637462-cff94ebb84ce?auto=format&fit=crop&w=600&q=80",
    badge: { price: "$25/hr", rating: "4.9 (12K+)" },
  },
  {
    title: "Handyman & Repairs",
    value: "more",
    bookable: false,
    featured: false,
    image: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=600&q=80",
    badge: null,
  },
  {
    title: "HVAC & Heating",
    value: "more",
    bookable: false,
    featured: false,
    image: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80",
    badge: null,
  },
  {
    title: "Appliance Installation",
    value: "more",
    bookable: false,
    featured: false,
    image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=600&q=80",
    badge: null,
  },
];

const HOW_IT_WORKS = [
  { title: "Instant Request",  description: "Select a category, share your location. Takes 30 seconds.",                     Icon: Search  },
  { title: "30-Second Match",  description: "We ping the closest verified pro. If they can't take it, the next one gets it.", Icon: Clock   },
  { title: "Secure Pay",       description: "Only pay when the job is marked complete and you're satisfied.",                 Icon: CreditCard },
];
