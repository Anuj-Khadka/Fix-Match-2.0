import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-cobalt">
          fix<span className="text-gray-900">match</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Welcome back</h1>
        <p className="mt-1 text-sm text-gray-500">Sign in to your account</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-50 cursor-pointer border-none"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link to="/signup" className="font-semibold text-cobalt hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
