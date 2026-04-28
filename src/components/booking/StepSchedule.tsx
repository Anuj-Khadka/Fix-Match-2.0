import { Zap, Calendar, ArrowRight } from "lucide-react";

export type ScheduleType = "instant" | "scheduled";

interface Props {
  scheduleType: ScheduleType | null;
  scheduledAt: string | null;
  onChange: (type: ScheduleType, scheduledAt: string | null) => void;
  onNext: () => void;
}

function minDateTime() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  // datetime-local format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

function formatScheduled(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short", month: "short", day: "numeric",
    hour: "numeric", minute: "2-digit",
  });
}

export function StepSchedule({ scheduleType, scheduledAt, onChange, onNext }: Props) {
  const canProceed =
    scheduleType === "instant" ||
    (scheduleType === "scheduled" && !!scheduledAt);

  return (
    <div className="flex flex-col w-full gap-5">
      <div>
        <h3 className="text-xl font-bold text-gray-900">When do you need help?</h3>
        <p className="mt-1 text-sm text-gray-500">Choose how quickly you need the service.</p>
      </div>

      {/* Option cards */}
      <div className="flex flex-col gap-3">
        {/* Instant */}
        <button
          onClick={() => onChange("instant", null)}
          className={`flex items-start gap-4 w-full rounded-2xl border-2 p-4 text-left transition cursor-pointer ${
            scheduleType === "instant"
              ? "border-cobalt bg-cobalt/5"
              : "border-gray-100 bg-white hover:border-cobalt/30"
          }`}
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            scheduleType === "instant" ? "bg-cobalt" : "bg-gray-100"
          }`}>
            <Zap size={20} className={scheduleType === "instant" ? "text-white" : "text-gray-400"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${scheduleType === "instant" ? "text-cobalt" : "text-gray-900"}`}>
              Get help now
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              We'll match you with an available pro immediately.
            </p>
          </div>
          <div className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
            scheduleType === "instant" ? "border-cobalt" : "border-gray-300"
          }`}>
            {scheduleType === "instant" && (
              <div className="h-2.5 w-2.5 rounded-full bg-cobalt" />
            )}
          </div>
        </button>

        {/* Scheduled */}
        <button
          onClick={() => onChange("scheduled", scheduledAt)}
          className={`flex items-start gap-4 w-full rounded-2xl border-2 p-4 text-left transition cursor-pointer ${
            scheduleType === "scheduled"
              ? "border-cobalt bg-cobalt/5"
              : "border-gray-100 bg-white hover:border-cobalt/30"
          }`}
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
            scheduleType === "scheduled" ? "bg-cobalt" : "bg-gray-100"
          }`}>
            <Calendar size={20} className={scheduleType === "scheduled" ? "text-white" : "text-gray-400"} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold ${scheduleType === "scheduled" ? "text-cobalt" : "text-gray-900"}`}>
              Schedule for later
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              Pick a date and time that works for you.
            </p>
            {scheduleType === "scheduled" && scheduledAt && (
              <p className="mt-1.5 text-xs font-semibold text-cobalt">
                {formatScheduled(scheduledAt)}
              </p>
            )}
          </div>
          <div className={`mt-0.5 h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center ${
            scheduleType === "scheduled" ? "border-cobalt" : "border-gray-300"
          }`}>
            {scheduleType === "scheduled" && (
              <div className="h-2.5 w-2.5 rounded-full bg-cobalt" />
            )}
          </div>
        </button>
      </div>

      {/* Date/time picker */}
      {scheduleType === "scheduled" && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
          <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
            Pick a date &amp; time
          </label>
          <input
            type="datetime-local"
            min={minDateTime()}
            value={scheduledAt ?? ""}
            onChange={(e) => onChange("scheduled", e.target.value || null)}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt cursor-pointer"
          />
        </div>
      )}

      <button
        onClick={onNext}
        disabled={!canProceed}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-cobalt py-3.5 text-sm font-semibold text-white shadow-lg shadow-cobalt/25 hover:bg-cobalt-dark transition disabled:opacity-40 cursor-pointer border-none"
      >
        Continue <ArrowRight size={16} />
      </button>
    </div>
  );
}
