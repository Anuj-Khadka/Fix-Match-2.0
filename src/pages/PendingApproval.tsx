import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Clock, XCircle, AlertCircle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../lib/supabase";

export function PendingApproval() {
  const { user, providerStatus, needsOnboarding } = useAuth();
  const navigate = useNavigate();
  const isRejected = providerStatus === "rejected";
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Fetch rejection reason from DB when denied
  useEffect(() => {
    if (!isRejected || !user) return;
    supabase
      .from("provider_profiles")
      .select("rejection_reason")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setRejectionReason(data?.rejection_reason ?? null);
      });
  }, [isRejected, user]);

  // If still in onboarding, redirect there instead
  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  const approvalSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("approvalSignOut error:", error);
      return;
    }

    navigate("/", { replace: true });
  };

  const goHome = async () => {
    if (user) {
      await approvalSignOut();
      return;
    }

    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9fafb] px-4 font-sans">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        {/* Icon */}
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${
            isRejected ? "bg-red-50" : "bg-amber-50"
          }`}
        >
          {isRejected ? (
            <XCircle size={32} className="text-red-500" />
          ) : (
            <Clock size={32} className="text-amber-500" />
          )}
        </div>

        {/* Title */}
        <h1 className="mt-6 text-2xl font-bold">
          {isRejected ? "Application Denied" : "Account Under Review"}
        </h1>

        {/* Subtitle */}
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          {isRejected
            ? "Your service provider application was reviewed and was not approved."
            : "Your service provider application is being reviewed. You'll get access to the marketplace once an admin approves your profile."}
        </p>

        {/* Rejection reason box */}
        {isRejected && (
          <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-4 text-left">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                Reason from Admin
              </p>
            </div>
            <p className="text-sm text-red-700 leading-relaxed">
              {rejectionReason ?? "No specific reason was provided. Please contact support."}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          {isRejected && (
            <>
              <button
                onClick={() => navigate("/onboarding")}
                className="rounded-xl bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
              >
                Edit & Resubmit Application
              </button>
              <button
                onClick={approvalSignOut}
                className="rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 cursor-pointer"
              >
                Sign Out
              </button>
            </>
          )}

          {!isRejected && (
            <button
              onClick={approvalSignOut}
              className="rounded-xl bg-cobalt py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
            >
              Sign Out
            </button>
          )}

          <button
            onClick={goHome}
            className="border-none bg-transparent text-sm font-medium text-gray-500 transition hover:text-cobalt cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
