import { ArrowRight, Zap } from "lucide-react";

interface Props {
  onStart: () => void;
}

export function StepHero({ onStart }: Props) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="inline-flex items-center gap-2 rounded-full bg-cobalt/10 px-4 py-1.5 text-xs font-semibold text-cobalt mb-5">
        <Zap size={14} /> Now live in your city
      </div>

      <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
        What do you need{" "}
        <span className="bg-gradient-to-r from-cobalt to-orange-400 bg-clip-text text-transparent">
          help with?
        </span>
      </h2>

      <p className="mt-3 text-sm text-gray-500 max-w-xs">
        Tell us what you need and we'll match you with a verified pro in minutes.
      </p>

      <button
        onClick={onStart}
        className="mt-8 flex items-center gap-2 rounded-2xl bg-cobalt px-10 py-4 text-base font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark hover:scale-[1.03] active:scale-[0.98] cursor-pointer border-none"
      >
        Find a Match <ArrowRight size={18} />
      </button>
    </div>
  );
}
