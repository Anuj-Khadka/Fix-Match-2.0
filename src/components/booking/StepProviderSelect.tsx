import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  MapPin,
  Star,
  Briefcase,
  Loader2,
  AlertCircle,
  ArrowLeft,
  X,
} from "lucide-react";
import type { JobCategory } from "../../hooks/useJobs";

export interface NearbyProvider {
  id: string;
  full_name: string | null;
  business_name: string | null;
  base_rate: number | null;
  years_of_experience: number | null;
  distance_miles: number;
  avg_rating: number | null;
  total_reviews: number;
}

interface Props {
  category: JobCategory;
  lat: number;
  lng: number;
  pendingProviderId: string | null;
  declinedProviderIds: string[];
  declineMessage: string | null;
  submitting: boolean;
  submitError: string | null;
  jobSearching: boolean;
  onRequestProvider: (provider: NearbyProvider) => void;
  onBack: () => void;
  onCancel: () => void;
}

export function StepProviderSelect({
  category,
  lat,
  lng,
  pendingProviderId,
  declinedProviderIds,
  declineMessage,
  submitting,
  submitError,
  jobSearching,
  onRequestProvider,
  onBack,
  onCancel,
}: Props) {
  const [providers, setProviders] = useState<NearbyProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setFetchError(null);
    supabase
      .rpc("get_nearby_providers_with_quotes", {
        p_lat: lat,
        p_lng: lng,
        p_category: category,
        p_radius_miles: 10,
      })
      .then(({ data, error }) => {
        setLoading(false);
        if (error) { setFetchError(error.message); return; }
        setProviders((data as { providers: NearbyProvider[] } | null)?.providers ?? []);
      });
  }, [category, lat, lng]);

  const visible = providers.filter((p) => !declinedProviderIds.includes(p.id));

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/15 overflow-hidden">
      {/* Header */}
      <div className="px-5 pt-4 flex items-center justify-between">
        {!jobSearching ? (
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-cobalt transition cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft size={16} /> Back
          </button>
        ) : (
          <span className="text-sm font-medium text-gray-400">Choose a pro</span>
        )}
        {jobSearching && (
          <button
            onClick={onCancel}
            className="flex items-center gap-1.5 text-sm font-medium text-red-500 hover:text-red-600 transition cursor-pointer bg-transparent border-none"
          >
            <X size={15} /> Cancel request
          </button>
        )}
      </div>

      <div className="p-6 pt-3">
        <h3 className="text-lg font-bold text-gray-900">
          Available {category} pros
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Within 10 miles · Estimated quotes shown
        </p>

        {/* Decline message */}
        {declineMessage && (
          <div className="mt-3 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
            <AlertCircle size={15} className="shrink-0" />
            {declineMessage}
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5">
            <AlertCircle size={15} className="shrink-0" />
            {submitError}
          </div>
        )}

        {/* Body */}
        <div className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 size={28} className="animate-spin text-cobalt" />
              <p className="text-sm text-gray-500">Finding pros near you…</p>
            </div>
          ) : fetchError ? (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
              <AlertCircle size={16} className="shrink-0" />
              {fetchError}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                <MapPin size={24} className="text-gray-400" />
              </div>
              <p className="font-semibold text-gray-800">No pros available nearby</p>
              <p className="text-sm text-gray-400 max-w-xs">
                There are no available {category} pros within 10 miles right now. Try again later.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {visible.map((p) => {
                const isPending = pendingProviderId === p.id;
                const name = p.business_name ?? p.full_name ?? "Provider";
                const initial = name[0].toUpperCase();

                return (
                  <div
                    key={p.id}
                    className={`rounded-2xl border bg-white shadow-sm transition-all p-4 ${
                      isPending
                        ? "border-cobalt/40 shadow-cobalt/10"
                        : "border-gray-100 hover:border-cobalt/30 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="w-11 h-11 rounded-full bg-cobalt/10 flex items-center justify-center text-cobalt font-bold text-base shrink-0">
                        {initial}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate">{name}</p>
                        {p.business_name && p.full_name && (
                          <p className="text-xs text-gray-400 truncate">{p.full_name}</p>
                        )}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin size={11} className="text-cobalt" />
                            {p.distance_miles} mi
                          </span>
                          {p.avg_rating !== null ? (
                            <span className="flex items-center gap-1">
                              <Star size={11} className="text-amber-400 fill-amber-400" />
                              {p.avg_rating}
                              <span className="text-gray-400">({p.total_reviews})</span>
                            </span>
                          ) : (
                            <span className="text-gray-400">New pro</span>
                          )}
                          {p.years_of_experience != null && (
                            <span className="flex items-center gap-1">
                              <Briefcase size={11} />
                              {p.years_of_experience}yr exp
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quote + button */}
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        {p.base_rate != null && (
                          <p className="text-sm font-bold text-gray-900 leading-none">
                            ${p.base_rate}
                            <span className="text-xs font-normal text-gray-400">/hr</span>
                          </p>
                        )}
                        <button
                          onClick={() => !isPending && !submitting && onRequestProvider(p)}
                          disabled={submitting || isPending}
                          className="px-3 py-1.5 rounded-lg bg-cobalt text-white text-xs font-semibold hover:bg-cobalt-dark transition disabled:opacity-60 flex items-center gap-1.5 cursor-pointer border-none whitespace-nowrap"
                        >
                          {isPending ? (
                            <>
                              <Loader2 size={11} className="animate-spin" />
                              Waiting…
                            </>
                          ) : (
                            "Request"
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Pending state sub-text */}
                    {isPending && (
                      <p className="mt-2 text-xs text-cobalt/70 pl-14">
                        Waiting for this pro to accept your request…
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
