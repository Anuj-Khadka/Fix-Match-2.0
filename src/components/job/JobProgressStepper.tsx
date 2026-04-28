import { Check } from "lucide-react";

const STEPS = [
  { status: "en_route", providerLabel: "Head to Location", clientLabel: "Pro is on the way" },
  { status: "arrived", providerLabel: "Arrived", clientLabel: "Pro has arrived" },
  { status: "in_progress", providerLabel: "Service Started", clientLabel: "Service in progress" },
  { status: "completed", providerLabel: "Job Complete", clientLabel: "Service completed" },
];

const STATUS_INDEX: Record<string, number> = {
  reviewing: -1,
  matched: -1,
  en_route: 0,
  arrived: 1,
  in_progress: 2,
  completed: 3,
};

interface Props {
  currentStatus: string;
  variant: "client" | "provider";
}

export function JobProgressStepper({ currentStatus, variant }: Props) {
  const activeIdx = STATUS_INDEX[currentStatus] ?? -1;

  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((step, i) => {
        const done = i < activeIdx || currentStatus === "completed";
        const active = i === activeIdx && currentStatus !== "completed";
        const label = variant === "provider" ? step.providerLabel : step.clientLabel;

        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all shrink-0 ${
                  done
                    ? "bg-emerald-500 text-white"
                    : active
                    ? "bg-cobalt text-white ring-4 ring-cobalt/20"
                    : "bg-gray-100 text-gray-400 border border-gray-200"
                }`}
              >
                {done ? <Check size={14} strokeWidth={3} /> : i + 1}
                {active && (
                  <span className="absolute inset-0 rounded-full border-2 border-cobalt animate-ping opacity-30" />
                )}
              </div>
              <span
                className={`text-[11px] leading-tight text-center max-w-[72px] ${
                  done ? "text-emerald-600 font-semibold" : active ? "text-cobalt font-semibold" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>

            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 rounded-full transition-colors ${
                  i < activeIdx || currentStatus === "completed" ? "bg-emerald-400" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
