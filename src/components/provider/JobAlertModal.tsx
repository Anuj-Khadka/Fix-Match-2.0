import { useState, useEffect, useCallback } from "react";
import {
  Wrench,
  Zap,
  Sparkles,
  Loader2,
  CheckCircle,
  XCircle,
  X,
  MapPin,
  FileText,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react";

interface Props {
  jobId: string;
  category: string;
  description: string | null;
  images: string[];
  locationLat: number | null;
  locationLng: number | null;
  scheduledAt: string | null;
  accepting: boolean;
  acceptError: string | null;
  onAccept: () => void;
  onDecline: () => void;
  onDismiss: () => void;
}

const CATEGORY_META: Record<
  string,
  { label: string; Icon: React.ComponentType<{ size?: number; className?: string }>; color: string; bg: string }
> = {
  plumbing:   { label: "Plumbing",   Icon: Wrench,    color: "text-cobalt",       bg: "bg-cobalt/10" },
  electrical: { label: "Electrical", Icon: Zap,        color: "text-yellow-500",   bg: "bg-yellow-50" },
  cleaning:   { label: "Cleaning",   Icon: Sparkles,   color: "text-emerald-600",  bg: "bg-emerald-50" },
};

const COUNTDOWN_SECONDS = 30;

function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function JobAlertModal({
  jobId,
  category,
  description,
  images,
  locationLat,
  locationLng,
  scheduledAt,
  accepting,
  acceptError,
  onAccept,
  onDecline,
  onDismiss,
}: Props) {
  const [phase, setPhase] = useState<"alert" | "review">("alert");
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const prevImage = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null)), [images.length]);
  const nextImage = useCallback(() =>
    setLightboxIndex((i) => (i !== null ? (i + 1) % images.length : null)), [images.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") prevImage();
      if (e.key === "ArrowRight") nextImage();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lightboxIndex, closeLightbox, prevImage, nextImage]);

  const meta = CATEGORY_META[category] ?? {
    label: category,
    Icon: Wrench,
    color: "text-gray-600",
    bg: "bg-gray-100",
  };

  // Countdown only runs in alert phase
  useEffect(() => {
    setPhase("alert");
    setSecondsLeft(COUNTDOWN_SECONDS);
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) { clearInterval(interval); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  const progress = (secondsLeft / COUNTDOWN_SECONDS) * 100;

  /* ── Phase 1: initial alert ── */
  if (phase === "alert") {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div
          className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
          style={{ animation: "fade-in-up 0.3s ease-out both" }}
        >
          {/* Countdown bar */}
          <div className="h-1 bg-gray-100">
            <div
              className="h-full bg-cobalt transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Dismiss */}
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer border-none z-10"
          >
            <X size={16} className="text-gray-500" />
          </button>

          <div className="p-6">
            {/* Header */}
            <div className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-2xl ${meta.bg} flex items-center justify-center mb-4`}>
                <meta.Icon size={32} className={meta.color} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">New Job Alert!</h3>
              <p className="mt-1 text-sm text-gray-500">
                <span className="font-semibold capitalize">{meta.label}</span> request nearby
              </p>
            </div>

            {/* Quick summary */}
            <div className="mt-4 space-y-2.5">
              {description && (
                <div className="flex items-start gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                  <FileText size={15} className="text-gray-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-gray-700 line-clamp-2">{description}</p>
                </div>
              )}
              {locationLat != null && locationLng != null && (
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                  <MapPin size={15} className="text-cobalt shrink-0" />
                  <span className="text-sm text-gray-700">
                    {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
                  </span>
                </div>
              )}
              {images.length > 0 && (
                <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                  <Eye size={15} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-600">
                    {images.length} photo{images.length > 1 ? "s" : ""} attached — review to see them
                  </span>
                </div>
              )}
              {scheduledAt && (
                <div className="flex items-center gap-2.5 rounded-xl bg-cobalt/5 border border-cobalt/20 px-4 py-3">
                  <Calendar size={15} className="text-cobalt shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-cobalt">Scheduled job</p>
                    <p className="text-sm text-gray-700">{formatScheduled(scheduledAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Timer */}
            <p className="mt-3 text-center text-xs text-gray-400">
              {secondsLeft > 0 ? `${secondsLeft}s to decide` : "Time expired"}
            </p>

            {/* Actions */}
            <div className="mt-5 flex gap-3">
              <button
                onClick={onDecline}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer bg-white"
              >
                Decline
              </button>
              <button
                onClick={() => setPhase("review")}
                disabled={secondsLeft === 0}
                className="flex-1 py-3 rounded-xl bg-cobalt text-white text-sm font-semibold hover:bg-cobalt-dark transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Eye size={16} />
                Review Job
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ── Phase 2: review details before accepting ── */
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: "fade-in-up 0.25s ease-out both" }}
      >
        {/* Review header bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
          <button
            onClick={() => setPhase("alert")}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition cursor-pointer border-none shrink-0"
          >
            <ArrowLeft size={15} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-900 capitalize">{meta.label} Job</p>
            <p className="text-xs text-amber-600 font-medium">Review period · client is waiting</p>
          </div>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${meta.bg} shrink-0`}>
            <meta.Icon size={18} className={meta.color} />
          </div>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Description */}
          {description ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Description</p>
              <div className="rounded-xl bg-gray-50 px-4 py-3">
                <p className="text-sm text-gray-800 leading-relaxed">{description}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-400 italic">
              No description provided
            </div>
          )}

          {/* Location */}
          {locationLat != null && locationLng != null && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Location</p>
              <div className="flex items-center gap-2.5 rounded-xl bg-gray-50 px-4 py-3">
                <MapPin size={15} className="text-cobalt shrink-0" />
                <span className="text-sm text-gray-700">
                  {locationLat.toFixed(5)}, {locationLng.toFixed(5)}
                </span>
              </div>
            </div>
          )}

          {/* Scheduled time */}
          {scheduledAt && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">Scheduled For</p>
              <div className="flex items-center gap-2.5 rounded-xl bg-cobalt/5 border border-cobalt/20 px-4 py-3">
                <Calendar size={15} className="text-cobalt shrink-0" />
                <span className="text-sm font-semibold text-cobalt">{formatScheduled(scheduledAt)}</span>
              </div>
            </div>
          )}

          {/* Photos */}
          {images.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5">
                Photos ({images.length})
              </p>
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setLightboxIndex(i)}
                    className="block aspect-square overflow-hidden rounded-xl border border-gray-100 cursor-zoom-in p-0 bg-transparent"
                  >
                    <img
                      src={url}
                      alt={`Job photo ${i + 1}`}
                      className="h-full w-full object-cover transition hover:scale-105"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {acceptError && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <XCircle size={15} className="shrink-0" />
              {acceptError}
            </div>
          )}
        </div>

        {/* Sticky action footer */}
        <div className="px-5 pb-5 pt-3 border-t border-gray-100 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition cursor-pointer bg-white"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={accepting}
            className="flex-1 py-3 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer border-none shadow-lg shadow-emerald-600/25"
          >
            {accepting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Accepting...
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

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition border-none cursor-pointer"
          >
            <X size={20} className="text-white" />
          </button>

          {/* Counter */}
          {images.length > 1 && (
            <p className="absolute top-5 left-1/2 -translate-x-1/2 text-xs font-semibold text-white/60">
              {lightboxIndex + 1} / {images.length}
            </p>
          )}

          {/* Prev */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); prevImage(); }}
              className="absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition border-none cursor-pointer"
            >
              <ChevronLeft size={22} className="text-white" />
            </button>
          )}

          {/* Image */}
          <img
            src={images[lightboxIndex]}
            alt={`Job photo ${lightboxIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); nextImage(); }}
              className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition border-none cursor-pointer"
            >
              <ChevronRight size={22} className="text-white" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
