import { useState } from "react";
import { Briefcase, FileText, Loader2, Clock, AlertCircle } from "lucide-react";
import type { Job } from "../../hooks/useJobs";
import { JobProgressStepper } from "./JobProgressStepper";

const NEXT_STATUS: Record<string, { next: string; label: string; color: string }> = {
  matched: { next: "en_route", label: "Head to Location", color: "bg-cobalt hover:bg-cobalt-dark shadow-cobalt/25" },
  en_route: { next: "arrived", label: "Mark Arrived", color: "bg-cobalt hover:bg-cobalt-dark shadow-cobalt/25" },
  arrived: { next: "in_progress", label: "Start Service", color: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25" },
  in_progress: { next: "completed", label: "Complete Job", color: "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25" },
};

interface Props {
  job: Job;
  onAdvance: (newStatus: string) => Promise<{ success: boolean; error?: string }>;
  elapsed: string | null;
}

export function ActiveJobCard({ job, onAdvance, elapsed }: Props) {
  const [advancing, setAdvancing] = useState(false);
  const [advanceError, setAdvanceError] = useState<string | null>(null);

  const action = NEXT_STATUS[job.status];

  async function handleAdvance() {
    if (!action) return;
    setAdvancing(true);
    setAdvanceError(null);

    const result = await onAdvance(action.next);
    setAdvancing(false);

    if (!result.success) {
      setAdvanceError(result.error ?? "Something went wrong");
    }
  }

  return (
    <div className="mt-4 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm space-y-5">
      {/* Job header */}
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
          <Briefcase size={24} className="text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-gray-900 capitalize">{job.category}</h3>
            <span className="rounded-full bg-cobalt/10 px-2.5 py-0.5 text-xs font-semibold text-cobalt capitalize">
              {job.status.replace("_", " ")}
            </span>
          </div>
          {job.description && (
            <p className="mt-1 text-sm text-gray-500 flex items-center gap-1.5">
              <FileText size={14} className="shrink-0" />
              <span className="truncate">{job.description}</span>
            </p>
          )}
        </div>
      </div>

      {/* Progress stepper */}
      <JobProgressStepper currentStatus={job.status} variant="provider" />

      {/* Elapsed time */}
      {elapsed && job.status === "in_progress" && (
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-2.5">
          <Clock size={15} className="text-cobalt" />
          <span>Service time: <span className="font-semibold text-gray-700">{elapsed}</span></span>
        </div>
      )}

      {/* Error */}
      {advanceError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
          <AlertCircle size={15} />
          {advanceError}
        </div>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={handleAdvance}
          disabled={advancing}
          className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 ${action.color}`}
        >
          {advancing ? <Loader2 size={16} className="animate-spin" /> : action.label}
        </button>
      )}
    </div>
  );
}
