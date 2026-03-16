import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Wrench,
  Zap,
  Sparkles,
  Hammer,
  Search,
  Clock,
  ShieldCheck,
  CreditCard,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Smile,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

/* ================================================================
   Fixmatch — Landing Page
   ================================================================ */

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  function handleCTA() {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/signup");
    }
  }

  function handleSearch() {
    // For now, just navigate to signup/dashboard — search logic comes later
    handleCTA();
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 antialiased">
      {/* ─── Navbar ───────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-cobalt no-underline">
            fix<span className="text-gray-900">match</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#services" className="text-sm font-medium text-gray-600 transition hover:text-cobalt">
              Services
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-gray-600 transition hover:text-cobalt">
              How It Works
            </a>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/signup")}
              className="rounded-full border-2 border-cobalt bg-transparent px-5 py-2 text-sm font-semibold text-cobalt transition hover:bg-cobalt hover:text-white cursor-pointer"
            >
              Become a Pro
            </button>
            <button
              onClick={() => navigate(user ? "/dashboard" : "/login")}
              className="rounded-full bg-cobalt px-5 py-2 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
            >
              {user ? "Dashboard" : "Sign In"}
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden bg-transparent border-none cursor-pointer text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-6 pb-6 pt-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a
                href="#services"
                className="text-sm font-medium text-gray-600"
                onClick={() => setMobileOpen(false)}
              >
                Services
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-gray-600"
                onClick={() => setMobileOpen(false)}
              >
                How It Works
              </a>
              <button
                onClick={() => { setMobileOpen(false); navigate(user ? "/dashboard" : "/signup"); }}
                className="rounded-full border-2 border-cobalt bg-transparent px-5 py-2 text-sm font-semibold text-cobalt cursor-pointer"
              >
                Become a Pro
              </button>
              <button
                onClick={() => { setMobileOpen(false); navigate(user ? "/dashboard" : "/login"); }}
                className="rounded-full bg-cobalt px-5 py-2 text-sm font-semibold text-white cursor-pointer border-none"
              >
                {user ? "Dashboard" : "Sign In"}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#fff7f3] via-white to-[#fafaf8] pt-32 pb-20 md:pt-44 md:pb-32">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-cobalt/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-32 top-20 h-[400px] w-[400px] rounded-full bg-orange-200/30 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 text-center">
          <div
            className="inline-flex items-center gap-2 rounded-full bg-cobalt/10 px-4 py-1.5 text-xs font-semibold text-cobalt mb-6"
          >
            <Zap size={14} /> Now live in your city
          </div>

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

          {/* Search Box */}
          <div
            className="mx-auto mt-10 flex max-w-xl flex-col gap-3 sm:flex-row"
            style={{ animation: "fade-in-up 0.7s ease-out 0.3s both" }}
          >
            <div className="relative flex-1">
              <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="What do you need help with?"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-white py-4 pr-4 pl-12 text-base shadow-lg shadow-gray-200/50 outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
              />
            </div>
            <button
              onClick={handleSearch}
              className="flex items-center justify-center gap-2 rounded-2xl bg-cobalt px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-none"
            >
              Find a Pro <ArrowRight size={18} />
            </button>
          </div>

          {/* Social proof */}
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

      {/* ─── Trusted By ──────────────────────────────────────── */}
      <section className="bg-white border-y border-gray-100 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <p className="text-center text-sm font-medium text-gray-400 mb-8 tracking-wide">
            Trusted by 500+ local businesses across the city
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {TRUSTED_BUSINESSES.map((biz) => (
              <div
                key={biz.name}
                className="flex items-center gap-2.5 bg-[#f0faf0] rounded-2xl px-6 py-4 select-none"
              >
                <span className="text-lg">{biz.emoji}</span>
                <div className="flex flex-col leading-tight">
                  <span className="text-[13px] font-black tracking-tight text-gray-900 uppercase">
                    {biz.name}
                  </span>
                  {biz.tagline && (
                    <span className="text-[9px] font-semibold tracking-widest text-gray-400 uppercase">
                      {biz.tagline}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bento Service Grid ──────────────────────────────── */}
      <section id="services" className="bg-[#f9fafb] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Every home service,{" "}
              <span className="text-cobalt">one platform.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              Browse top-rated professionals across the most in-demand categories.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((s, i) => (
              <button
                key={s.title}
                onClick={handleCTA}
                className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 text-left shadow-sm transition hover:shadow-xl hover:border-cobalt/30 hover:scale-[1.02] active:scale-[0.99] cursor-pointer"
                style={{ animation: `fade-in-up 0.5s ease-out ${0.1 * i}s both` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.bg} mb-5`}>
                  <s.icon size={24} className={s.iconColor} />
                </div>
                <h3 className="text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {s.description}
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-cobalt opacity-0 transition group-hover:opacity-100">
                  Book now <ArrowRight size={14} />
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps. <span className="text-cobalt">That's it.</span>
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-gray-500">
              From request to doorbell in minutes — here's how Fixmatch works.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative text-center"
                style={{ animation: `fade-in-up 0.5s ease-out ${0.15 * i}s both` }}
              >
                {/* Step number */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-cobalt/10"
                  style={{ animation: "float 3s ease-in-out infinite", animationDelay: `${i * 0.5}s` }}
                >
                  <step.icon size={28} className="text-cobalt" />
                </div>

                {/* Connector line (desktop) */}
                {i < STEPS.length - 1 && (
                  <div className="absolute top-8 left-[calc(50%+40px)] hidden h-[2px] w-[calc(100%-80px)] bg-gradient-to-r from-cobalt/30 to-cobalt/5 md:block" />
                )}

                <span className="mt-5 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                  STEP {i + 1}
                </span>
                <h3 className="mt-3 text-xl font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">
                  {step.description}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <button
              onClick={handleCTA}
              className="inline-flex items-center gap-2 rounded-full bg-cobalt px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-none"
            >
              Get Started — It's Free <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* ─── Testimonials + Stats Bento ──────────────────────── */}
      <section className="bg-[#f9fafb] py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            {/* Left — heading + testimonial card */}
            <div>
              <h2 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl md:text-[2.75rem]">
                Check out what our{" "}
                <span className="underline decoration-cobalt/40 decoration-[3px] underline-offset-4">
                  clients have to say
                </span>{" "}
                about their time with us!
              </h2>

              {/* Testimonial card */}
              <div className="mt-10 rounded-2xl bg-[#fdf2f0] p-8">
                <span className="text-4xl font-serif leading-none text-cobalt/60">&ldquo;</span>
                <p className="mt-2 text-[15px] leading-relaxed text-gray-700">
                  {TESTIMONIALS[testimonialIdx].quote}
                </p>
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={TESTIMONIALS[testimonialIdx].avatar}
                      alt={TESTIMONIALS[testimonialIdx].name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {TESTIMONIALS[testimonialIdx].name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {TESTIMONIALS[testimonialIdx].title}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setTestimonialIdx((prev) =>
                          prev === 0 ? TESTIMONIALS.length - 1 : prev - 1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-cobalt hover:text-cobalt cursor-pointer"
                      aria-label="Previous testimonial"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <button
                      onClick={() =>
                        setTestimonialIdx((prev) =>
                          prev === TESTIMONIALS.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-300 bg-white text-gray-600 transition hover:border-cobalt hover:text-cobalt cursor-pointer"
                      aria-label="Next testimonial"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right — bento grid (3 cols, 2 rows) */}
            <div className="grid grid-cols-3 grid-rows-2 gap-4 h-[420px]">
              {/* Worker on ladder — spans 2 rows, first col */}
              <div className="row-span-2 overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=800&fit=crop"
                  alt="Professional at work"
                  className="h-full w-full object-cover"
                />
              </div>

              {/* 4.9 Trustpilot — bottom-left of the right 2×2 */}
              <div className="flex flex-col items-start justify-center rounded-2xl bg-white p-6 shadow-sm">
                <Star size={28} className="fill-emerald-500 text-emerald-500" />
                <p className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">
                  4.9
                </p>
                <p className="mt-1 text-sm text-gray-500">Trustpilot reviews</p>
              </div>

              {/* 25K+ stat card */}
              <div className="flex flex-col items-start justify-center rounded-2xl bg-white p-6 shadow-sm">
                <Smile size={28} className="text-emerald-400" />
                <p className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">
                  25K+
                </p>
                <p className="mt-1 text-sm text-gray-500">Happy clients</p>
              </div>

              {/* Drill worker photo — spans bottom-right 2 cols */}
              <div className="col-span-2 overflow-hidden rounded-2xl">
                <img
                  src="https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=400&fit=crop"
                  alt="Worker with power tools"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Become a Pro CTA Banner ─────────────────────────── */}
      <section className="bg-gradient-to-r from-cobalt to-orange-600 py-16 md:py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Got skills? Earn on your own schedule.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-orange-100">
            Join thousands of verified pros on Fixmatch. Set your own hours,
            keep more of what you earn, and get matched instantly.
          </p>
          <button
            onClick={() => navigate(user ? "/dashboard" : "/signup")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-cobalt shadow-lg transition hover:bg-gray-50 hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-none"
          >
            Become a Pro <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="bg-navy text-gray-400">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div>
              <span className="text-2xl font-extrabold tracking-tight text-white">
                fix<span className="text-cobalt">match</span>
              </span>
              <p className="mt-4 text-sm leading-relaxed">
                Connecting homeowners with trusted professionals — fast, secure,
                and transparent.
              </p>
              <div className="mt-6 flex gap-4">
                {[Twitter, Instagram, Linkedin].map((Icon, i) => (
                  <a
                    key={i}
                    href="#"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-light text-gray-400 transition hover:bg-cobalt hover:text-white"
                  >
                    <Icon size={16} />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            {FOOTER_LINKS.map((group) => (
              <div key={group.title}>
                <h4 className="text-sm font-semibold uppercase tracking-wider text-white">
                  {group.title}
                </h4>
                <ul className="mt-4 space-y-3 text-sm list-none p-0">
                  {group.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="transition hover:text-white">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom Bar */}
          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
            <p className="text-xs">&copy; {new Date().getFullYear()} Fixmatch, Inc. All rights reserved.</p>
            <div className="flex items-center gap-2 text-xs">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span>Securely Powered by <strong className="text-white">Stripe</strong></span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* ================================================================
   Data
   ================================================================ */

const SERVICES = [
  {
    title: "Plumbing",
    description: "Leaky faucets, clogged drains, pipe repairs — handled within the hour.",
    icon: Wrench,
    bg: "bg-orange-50",
    iconColor: "text-cobalt",
  },
  {
    title: "Electrical",
    description: "Wiring, outlet installs, panel upgrades by licensed electricians.",
    icon: Zap,
    bg: "bg-amber-50",
    iconColor: "text-amber-500",
  },
  {
    title: "Cleaning",
    description: "Deep cleans, move-out scrubs, and recurring schedules that shine.",
    icon: Sparkles,
    bg: "bg-emerald-50",
    iconColor: "text-emerald-500",
  },
  {
    title: "Handyman",
    description: "Furniture assembly, drywall patches, odd jobs — no task too small.",
    icon: Hammer,
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

const STEPS = [
  {
    title: "Instant Request",
    description: "Describe what you need and share your location. Takes 30 seconds.",
    icon: Search,
  },
  {
    title: "30-Second Match",
    description: "We ping the closest verified pro. If they can't take it, the next one gets it.",
    icon: Clock,
  },
  {
    title: "Secure Pay",
    description: "Only pay when the job is marked complete and you're satisfied with the work.",
    icon: CreditCard,
  },
];

const TRUSTED_BUSINESSES = [
  { name: "Rivera Plumbing",    tagline: "Est. 2004",       emoji: "🔧" },
  { name: "Volt Pro",           tagline: "Electric Co.",    emoji: "⚡" },
  { name: "Sparkle Clean",      tagline: "Home Services",   emoji: "✨" },
  { name: "BuildRight",         tagline: "Contractors",     emoji: "🏗️" },
  { name: "PipeWorks",          tagline: "Plumbing & HVAC", emoji: "💧" },
  { name: "HomeFix Co.",        tagline: "Repairs & More",  emoji: "🏠" },
];

const TESTIMONIALS = [
  {
    quote:
      "Working with Fixmatch has been amazing. Professional, responsive team with great results. Highly recommend! Their expertise, dedication, and friendly service make them shine. We'll definitely come back for more future projects and support.",
    name: "Everett Harris",
    title: "CEO of Elson",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    quote:
      "Found a licensed electrician within minutes of posting. The whole process was seamless — from matching to payment. Fixmatch is our go-to for every home repair now.",
    name: "Maria Gonzalez",
    title: "Homeowner",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    quote:
      "As a property manager with 30+ units, Fixmatch has saved me countless hours. Reliable pros, transparent pricing, and instant booking. Can't imagine going back to the old way.",
    name: "James Whitfield",
    title: "Property Manager",
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
  },
];

const FOOTER_LINKS = [
  {
    title: "Product",
    links: ["How It Works", "Pricing", "Categories", "Enterprise"],
  },
  {
    title: "Company",
    links: ["About", "Careers", "Blog", "Press"],
  },
  {
    title: "Support",
    links: ["Help Center", "Safety", "Terms of Service", "Privacy Policy"],
  },
];
