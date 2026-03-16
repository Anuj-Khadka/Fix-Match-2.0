import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Twitter,
  Instagram,
  Linkedin,
  Menu,
  X,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function NotFound() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-gray-900 antialiased">
      {/* ─── Navbar ───────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full border-b border-white/20 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-extrabold tracking-tight text-cobalt no-underline">
            fix<span className="text-gray-900">match</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
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

          <button
            className="md:hidden bg-transparent border-none cursor-pointer text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-gray-100 bg-white px-6 pb-6 pt-4 md:hidden">
            <div className="flex flex-col gap-4">
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

      {/* ─── 404 Content ─────────────────────────────────────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-cobalt">
          404 Error
        </p>
        <h1 className="mt-4 text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-lg text-gray-500">
          Sorry, the page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-cobalt px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark hover:scale-[1.03] active:scale-[0.98] no-underline"
        >
          Go back home
        </Link>
      </main>

      {/* ─── Footer ──────────────────────────────────────────── */}
      <footer className="bg-navy text-gray-400">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
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
