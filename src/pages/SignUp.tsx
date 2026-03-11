import { FormEvent, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Role } from "../hooks/useAuth";

export function SignUp() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("client");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role, // only 'client' or 'provider' accepted by the DB trigger
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // The DB trigger writes the role to app_metadata AFTER the JWT was
    // already minted, so the initial session has no role.  A short delay
    // + session refresh forces a new JWT that includes the role.
    await new Promise((r) => setTimeout(r, 500));
    await supabase.auth.refreshSession();

    setLoading(false);
    navigate("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-cobalt">
          fix<span className="text-gray-900">match</span>
        </Link>
        <h1 className="mt-6 text-2xl font-bold">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">Join the home services marketplace</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>
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
              minLength={6}
              className="mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
            />
          </div>

          {/* Role picker */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700">I want to:</legend>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <label
                className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                  role === "client"
                    ? "border-cobalt bg-cobalt/5 text-cobalt"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={role === "client"}
                  onChange={() => setRole("client")}
                  className="sr-only"
                />
                I'm a Client
              </label>
              <label
                className={`flex cursor-pointer items-center justify-center rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                  role === "provider"
                    ? "border-cobalt bg-cobalt/5 text-cobalt"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value="provider"
                  checked={role === "provider"}
                  onChange={() => setRole("provider")}
                  className="sr-only"
                />
                I'm a Service Provider
              </label>
            </div>
          </fieldset>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-50 cursor-pointer border-none"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-cobalt hover:underline">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
}
