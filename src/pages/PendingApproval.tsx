import { Link } from "react-router-dom";
import { Clock, XCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export function PendingApproval() {
  const { providerStatus } = useAuth();
  const isRejected = providerStatus === "rejected";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${isRejected ? "bg-red-50" : "bg-amber-50"}`}>
          {isRejected ? (
            <XCircle size={32} className="text-red-500" />
          ) : (
            <Clock size={32} className="text-amber-500" />
          )}
        </div>

        <h1 className="mt-6 text-2xl font-bold">
          {isRejected ? "Application Denied" : "Account Under Review"}
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          {isRejected
            ? "Your service provider application has been rejected. Please contact support for more information."
            : "Your service provider application is being reviewed. You'll get access to the marketplace once an admin approves your profile."}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-xl bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
          >
            Sign Out
          </button>
          <Link
            to="/"
            className="text-sm font-medium text-gray-500 transition hover:text-cobalt"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
