import { CheckCircle, MapPin, FileText, Image, Loader2, AlertCircle } from "lucide-react";
import type { JobCategory } from "../../hooks/useJobs";

interface Props {
  category: JobCategory | null;
  description: string;
  address: string;
  imageCount: number;
  onConfirm: () => void;
  submitting: boolean;
  error: string | null;
}

export function StepCheckpoint({
  category,
  description,
  address,
  imageCount,
  onConfirm,
  submitting,
  error,
}: Props) {
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-14 h-14 rounded-full bg-cobalt/10 flex items-center justify-center mb-4">
        <CheckCircle size={28} className="text-cobalt" />
      </div>

      <h3 className="text-xl font-bold text-gray-900">Review & Confirm</h3>
      <p className="mt-1 text-sm text-gray-500 max-w-xs">
        Double-check the details below, then tap confirm to find a pro.
      </p>

      {/* Summary */}
      <div className="mt-5 w-full space-y-3 text-left">
        {category && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt/10 flex items-center justify-center shrink-0">
              <CheckCircle size={16} className="text-cobalt" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Service</p>
              <p className="text-sm font-semibold text-gray-900 capitalize">{category}</p>
            </div>
          </div>
        )}

        {description && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt/10 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-cobalt" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Description</p>
              <p className="text-sm text-gray-900 break-words">{description}</p>
            </div>
          </div>
        )}

        {address && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt/10 flex items-center justify-center shrink-0">
              <MapPin size={16} className="text-cobalt" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400">Location</p>
              <p className="text-sm text-gray-900 break-words">{address}</p>
            </div>
          </div>
        )}

        {imageCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
            <div className="w-8 h-8 rounded-lg bg-cobalt/10 flex items-center justify-center shrink-0">
              <Image size={16} className="text-cobalt" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Photos</p>
              <p className="text-sm font-semibold text-gray-900">{imageCount} attached</p>
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2 w-full">
          <AlertCircle size={16} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Confirm button */}
      <button
        onClick={onConfirm}
        disabled={submitting}
        className="mt-5 w-full py-3 rounded-xl bg-cobalt text-white font-semibold text-sm hover:bg-cobalt-dark transition disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
      >
        {submitting ? (
          <>
            <Loader2 size={18} className="animate-spin" />
            Submitting…
          </>
        ) : (
          "Confirm & Request Pro"
        )}
      </button>
    </div>
  );
}
