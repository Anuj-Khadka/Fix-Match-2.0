import { useState, useRef } from "react";
import { CreditCard, Lock, CheckCircle, Loader2, X } from "lucide-react";
import { supabase } from "../../lib/supabase";

interface Props {
  total: number;
  tip: number;
  jobId: string;
  clientId: string;
  providerId: string | null;
  jobCategory: string;
  providerName: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

type Step = "form" | "processing" | "success";

function fmt(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function makeTxnRef() {
  return "TXN-" + Math.random().toString(36).slice(2, 10).toUpperCase();
}

export function PaymentModal({ total, tip, jobId, clientId, providerId, jobCategory, providerName, onSuccess, onClose }: Props) {
  const [step, setStep]         = useState<Step>("form");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName]     = useState("");
  const [expiry, setExpiry]         = useState("");
  const [cvv, setCvv]               = useState("");
  const txnRef = useRef(makeTxnRef());

  const digits   = cardNumber.replace(/\s/g, "");
  const last4    = digits.slice(-4);
  const formValid =
    digits.length === 16 &&
    cardName.trim().length > 0 &&
    expiry.length === 5 &&
    cvv.length >= 3;

  function handleCardNumber(val: string) {
    const d = val.replace(/\D/g, "").slice(0, 16);
    setCardNumber(d.replace(/(.{4})/g, "$1 ").trim());
  }

  function handleExpiry(val: string) {
    const d = val.replace(/\D/g, "").slice(0, 4);
    setExpiry(d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d);
  }

  async function handlePay() {
    setStep("processing");
    await new Promise((r) => setTimeout(r, 1800));

    await supabase.from("payments").insert({
      job_id: jobId,
      client_id: clientId,
      provider_id: providerId,
      amount: total,
      tip,
      status: "completed",
      transaction_ref: txnRef.current,
      card_last4: last4,
    });

    // Notify the provider in real time
    if (providerId) {
      const ch = supabase.channel(`payment_notice:${providerId}`, {
        config: { broadcast: { self: false } },
      });
      ch.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          ch.send({
            type: "broadcast",
            event: "payment_received",
            payload: { amount: total, tip, category: jobCategory, transaction_ref: txnRef.current },
          });
          setTimeout(() => supabase.removeChannel(ch), 1000);
        }
      });
    }

    setStep("success");
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={step === "form" ? onClose : undefined}
      />

      <div
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl overflow-hidden"
        style={{ animation: "fade-in-up 0.3s ease-out both" }}
      >
        {/* ── Card form ───────────────────────────────── */}
        {step === "form" && (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-cobalt to-cobalt/80 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                    <Lock size={16} />
                  </div>
                  <div>
                    <p className="font-bold leading-tight">Secure Payment</p>
                    <p className="text-sm text-white/70">Total: {fmt(total)}</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer bg-transparent border-none transition">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Visual card */}
              <div className="rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 p-5 text-white select-none">
                <div className="flex justify-between items-start mb-8">
                  <CreditCard size={26} className="text-white/50" />
                  <div className="flex">
                    <div className="w-6 h-6 rounded-full bg-red-400 opacity-90" />
                    <div className="w-6 h-6 rounded-full bg-yellow-400 opacity-90 -ml-2" />
                  </div>
                </div>
                <p className="font-mono text-lg tracking-widest">
                  {cardNumber || "•••• •••• •••• ••••"}
                </p>
                <div className="mt-3 flex justify-between text-xs text-white/50">
                  <span>{cardName || "CARDHOLDER NAME"}</span>
                  <span>{expiry || "MM/YY"}</span>
                </div>
              </div>

              {/* Card number */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Card Number</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => handleCardNumber(e.target.value)}
                  maxLength={19}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15 transition"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">Cardholder Name</label>
                <input
                  type="text"
                  placeholder="John Smith"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15 transition"
                />
              </div>

              {/* Expiry + CVV */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Expiry</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="MM/YY"
                    value={expiry}
                    onChange={(e) => handleExpiry(e.target.value)}
                    maxLength={5}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">CVV</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="•••"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    maxLength={4}
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-mono outline-none focus:border-cobalt focus:ring-2 focus:ring-cobalt/15 transition"
                  />
                </div>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={!formValid}
                className="w-full py-3.5 rounded-2xl bg-cobalt text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-cobalt-dark transition disabled:opacity-40 cursor-pointer border-none shadow-lg shadow-cobalt/20"
              >
                <Lock size={14} /> Pay {fmt(total)}
              </button>

              <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
                <Lock size={10} /> Payments are secure and encrypted
              </p>
            </div>
          </>
        )}

        {/* ── Processing ──────────────────────────────── */}
        {step === "processing" && (
          <div className="py-20 px-6 flex flex-col items-center text-center gap-5">
            <div className="w-16 h-16 rounded-full bg-cobalt/10 flex items-center justify-center">
              <Loader2 size={32} className="text-cobalt animate-spin" />
            </div>
            <div>
              <p className="font-bold text-gray-900 text-lg">Processing payment…</p>
              <p className="text-sm text-gray-400 mt-1">Please don't close this window.</p>
            </div>
          </div>
        )}

        {/* ── Success ─────────────────────────────────── */}
        {step === "success" && (
          <div className="p-6 flex flex-col items-center gap-5">
            {/* Icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>

            <div className="text-center">
              <p className="font-bold text-gray-900 text-xl">Payment Successful!</p>
              <p className="text-sm text-gray-500 mt-1">
                {providerName
                  ? `Thank you for using ${providerName}'s service.`
                  : "Thank you for your payment."}
              </p>
            </div>

            {/* Receipt */}
            <div className="w-full rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-2.5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Receipt</p>
              <ReceiptRow label="Amount paid" value={fmt(total)} />
              {tip > 0 && <ReceiptRow label="Includes tip" value={fmt(tip)} />}
              <ReceiptRow label="Card" value={`•••• •••• •••• ${last4}`} />
              <ReceiptRow label="Reference" value={txnRef.current} mono />
              <ReceiptRow
                label="Date"
                value={new Date().toLocaleString(undefined, {
                  month: "short", day: "numeric", year: "numeric",
                  hour: "numeric", minute: "2-digit",
                })}
              />
            </div>

            <button
              onClick={onSuccess}
              className="w-full py-3.5 rounded-2xl bg-cobalt text-white font-semibold text-sm hover:bg-cobalt-dark transition cursor-pointer border-none shadow-lg shadow-cobalt/20"
            >
              Continue to Rate Your Pro
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function ReceiptRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-500 shrink-0">{label}</span>
      <span className={`text-sm font-semibold text-gray-900 text-right truncate ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}
