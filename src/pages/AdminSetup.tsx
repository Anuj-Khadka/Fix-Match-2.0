import { useState, type FormEvent } from "react";
import { useParams, Navigate } from "react-router-dom";
import { Shield, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

const ADMIN_SETUP_KEY = import.meta.env.VITE_ADMIN_SETUP_KEY || "fixmatch-admin-2026";

export function AdminSetup() {
  const { key } = useParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Wrong key — show nothing
  if (key !== ADMIN_SETUP_KEY) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: rpcError } = await supabase.rpc("promote_to_admin", {
      user_email: email,
      secret_key: key,
    });

    setLoading(false);

    if (rpcError) {
      setError(rpcError.message);
      return;
    }

    if (data && !data.success) {
      setError(data.error || "Promotion failed");
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 font-sans">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-xl font-bold text-gray-900">Admin Promoted</h1>
          <p className="mt-2 text-sm text-gray-500">
            <strong>{email}</strong> now has admin privileges. They need to log out and back in for the role to take effect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-cobalt/10">
          <Shield className="h-6 w-6 text-cobalt" />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-gray-900">Admin Setup</h1>
        <p className="mt-1 text-center text-sm text-gray-500">
          Promote an existing user to admin role
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              User Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="user@example.com"
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-50 cursor-pointer border-none"
          >
            {loading ? "Promoting..." : "Promote to Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}
