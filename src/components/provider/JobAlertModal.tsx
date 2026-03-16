import { useState, useEffect } from "react";
import {
  Wrench,
  Zap,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";

interface Props {
  jobId: string;
  category: string;
  accepting: boolean;
  acceptError: string | null;
  onAccept: () => void;
  onDismiss: () => void;
}

const CATEGORY_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; color: string }
> = {
  plumbing: { label: "Plumbing", Icon: Wrench, color: "text-cobalt" },
  electrical: { label: "Electrical", Icon: Zap, color: "text-yellow-500" },
  cleaning: { label: "Cleaning", Icon: Sparkles, color: "text-emerald-600" },
};

const COUNTDOWN_SECONDS = 30;

export function JobAlertModal({
  jobId,
  category,
  accepting,
  acceptError,
  onAccept,
  onDismiss,
}: Props) {
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const meta = CATEGORY_META[category] ?? {
    label: category,
    Icon: Wrench,
    color: "text-gray-600",
  };

  // Countdown timer
  useEffect(() => {
    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: "fade-in-up 0.3s ease-out both" }}
      >
        {/* Countdown progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-cobalt transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Close button */}
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer border-none"
        >
          <X size={16} className="text-gray-500" />
        </button>

        <div className="p-6 text-center">
          {/* Category icon */}
          <div className="mx-auto w-16 h-16 rounded-2xl bg-cobalt/10 flex items-center justify-center mb-4">
            <meta.Icon size={32} className={meta.color} />
          </div>

          <h3 className="text-xl font-bold text-gray-900">New Job Alert!</h3>
          <p className="mt-1 text-sm text-gray-500">
            <span className="font-semibold capitalize">{meta.label}</span> request nearby
          </p>

          {/* Timer */}
          <p className="mt-3 text-xs text-gray-400">
            {secondsLeft > 0 ? `${secondsLeft}s remaining` : "Time expired"}
          </p>

          {/* Error */}
          {acceptError && (
            <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">
              <XCircle size={16} className="shrink-0" />
              {acceptError}
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer bg-white"
            >
              Pass
            </button>
            <button
              onClick={onAccept}
              disabled={accepting || secondsLeft === 0}
              className="flex-1 py-3 rounded-xl bg-cobalt text-white text-sm font-semibold hover:bg-cobalt-dark transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {accepting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Accepting…
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  Accept Job
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
