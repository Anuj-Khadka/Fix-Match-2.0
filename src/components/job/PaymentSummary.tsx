import { useState } from "react";
import { DollarSign, Clock, Percent, ChevronRight, AlertCircle } from "lucide-react";

const COMMISSION_RATE = 0.12;
const TAX_RATE = 0.0665;
const TIP_PRESETS = [20, 22, 25] as const;

interface Props {
  startedAt: string | null;
  completedAt: string | null;
  baseRate: number | null;
  providerName: string | null;
  onConfirm: (tipAmount: number) => void;
}

function formatDuration(ms: number): string {
  const totalMins = Math.round(ms / 60000);
  if (totalMins < 60) return `${totalMins}m`;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function fmt(n: number): string {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function PaymentSummary({ startedAt, completedAt, baseRate, providerName, onConfirm }: Props) {
  const [tipPreset, setTipPreset] = useState<20 | 22 | 25 | "custom" | null>(null);
  const [customTip, setCustomTip] = useState("");

  // Time worked — minimum 5 minutes for billing purposes
  const MIN_DURATION_MS = 5 * 60 * 1000;
  const start = startedAt ? new Date(startedAt).getTime() : null;
  const end = completedAt ? new Date(completedAt).getTime() : null;
  const rawDurationMs = start && end ? Math.max(0, end - start) : null;
  const durationMs = rawDurationMs != null ? Math.max(rawDurationMs, MIN_DURATION_MS) : null;
  const durationHours = durationMs != null ? durationMs / 3600000 : null;

  // Costs (all zero if rate/time missing)
  const rate = baseRate ?? 0;
  const hours = durationHours ?? 0;
  const serviceCost = rate * hours;
  const commission = serviceCost * COMMISSION_RATE;
  const tax = serviceCost * TAX_RATE;
  const subtotal = serviceCost + commission + tax;

  // Tip
  const tipPercent =
    tipPreset === "custom" ? null : tipPreset != null ? tipPreset : null;
  const tipFromPercent = tipPercent != null ? (tipPercent / 100) * serviceCost : 0;
  const tipFromCustom =
    tipPreset === "custom" ? Math.max(0, parseFloat(customTip) || 0) : 0;
  const tipAmount = tipPreset === "custom" ? tipFromCustom : tipFromPercent;

  const total = subtotal + tipAmount;

  const missingRate = baseRate == null || baseRate === 0;
  const missingTime = durationMs == null;

  return (
    <div
      className="mx-auto mt-10 max-w-xl rounded-2xl bg-white border border-gray-100 shadow-xl shadow-black/5 overflow-hidden"
      style={{ animation: "fade-in-up 0.4s ease-out both" }}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-cobalt to-cobalt/80 px-6 py-5 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <DollarSign size={20} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg leading-tight">Payment Summary</h3>
            <p className="text-sm text-white/70 mt-0.5">
              {providerName ? `Service by ${providerName}` : "Review your charges"}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {/* Missing data warning */}
        {(missingRate || missingTime) && (
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-sm text-amber-700">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              {missingRate && missingTime
                ? "Rate and duration unavailable — final amount will be confirmed separately."
                : missingRate
                ? "Provider rate not set — final amount will be confirmed separately."
                : "Job duration unavailable — final amount will be confirmed separately."}
            </span>
          </div>
        )}

        {/* Duration pill */}
        {durationMs != null && (
          <div className="flex items-center gap-2 rounded-xl bg-gray-50 px-4 py-3">
            <Clock size={15} className="text-cobalt shrink-0" />
            <span className="text-sm text-gray-700">
              Time worked:{" "}
              <span className="font-semibold text-gray-900">{formatDuration(durationMs)}</span>
            </span>
            {baseRate != null && (
              <span className="ml-auto text-xs text-gray-400">
                @ {fmt(baseRate)}/hr
              </span>
            )}
          </div>
        )}

        {/* Breakdown */}
        <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          <Row
            label={
              durationMs != null && baseRate != null
                ? `Service (${formatDuration(durationMs)} × ${fmt(baseRate)}/hr)`
                : "Service"
            }
            value={fmt(serviceCost)}
          />
          <Row
            label="Platform fee (12%)"
            value={fmt(commission)}
            sub
          />
          <Row
            label="Tax (6.625%)"
            value={fmt(tax)}
            sub
          />
          <Row
            label="Subtotal"
            value={fmt(subtotal)}
            bold
          />
          {tipAmount > 0 && (
            <Row label="Tip" value={`+${fmt(tipAmount)}`} green />
          )}
          <Row
            label="Total"
            value={fmt(total)}
            total
          />
        </div>

        {/* Tip section */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Add a tip
          </p>
          <div className="flex gap-2">
            {TIP_PRESETS.map((pct) => (
              <button
                key={pct}
                onClick={() => setTipPreset(pct)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition cursor-pointer ${
                  tipPreset === pct
                    ? "border-cobalt bg-cobalt text-white"
                    : "border-gray-200 bg-white text-gray-700 hover:border-cobalt/40"
                }`}
              >
                {pct}%
                {serviceCost > 0 && (
                  <span className={`block text-xs mt-0.5 font-normal ${tipPreset === pct ? "text-white/80" : "text-gray-400"}`}>
                    {fmt((pct / 100) * serviceCost)}
                  </span>
                )}
              </button>
            ))}
            <button
              onClick={() => setTipPreset("custom")}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition cursor-pointer ${
                tipPreset === "custom"
                  ? "border-cobalt bg-cobalt text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-cobalt/40"
              }`}
            >
              <Percent size={13} className="mx-auto mb-0.5" />
              Custom
            </button>
          </div>

          {tipPreset === "custom" && (
            <div className="mt-3 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium text-sm">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={customTip}
                onChange={(e) => setCustomTip(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-8 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt"
              />
            </div>
          )}

          {tipPreset === null && (
            <button
              onClick={() => onConfirm(0)}
              className="mt-2 text-xs text-gray-400 hover:text-gray-600 transition cursor-pointer bg-transparent border-none underline underline-offset-2"
            >
              Skip tip
            </button>
          )}
        </div>

        {/* Confirm button */}
        <button
          onClick={() => onConfirm(tipAmount)}
          disabled={tipPreset === "custom" && customTip === ""}
          className="w-full py-3.5 rounded-2xl bg-cobalt text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cobalt-dark transition disabled:opacity-50 cursor-pointer border-none shadow-lg shadow-cobalt/20"
        >
          {tipAmount > 0 ? `Confirm & Proceed · ${fmt(total)}` : "Proceed to Review"}
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  sub,
  bold,
  green,
  total,
}: {
  label: string;
  value: string;
  sub?: boolean;
  bold?: boolean;
  green?: boolean;
  total?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between px-4 py-3 ${
        total ? "bg-gray-50" : "bg-white"
      }`}
    >
      <span
        className={`text-sm ${
          total ? "font-bold text-gray-900" : bold ? "font-semibold text-gray-800" : sub ? "text-gray-500" : "text-gray-700"
        }`}
      >
        {label}
      </span>
      <span
        className={`text-sm font-semibold ${
          total ? "text-gray-900 text-base" : green ? "text-emerald-600" : "text-gray-900"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
