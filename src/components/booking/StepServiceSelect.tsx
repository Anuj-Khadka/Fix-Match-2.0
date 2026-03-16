import type { JobCategory } from "../../hooks/useJobs";

interface CategoryItem {
  value: JobCategory | "more";
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}

interface Props {
  categories: CategoryItem[];
  onSelect: (category: JobCategory) => void;
}

export function StepServiceSelect({ categories, onSelect }: Props) {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Select a service</h3>
      <p className="text-sm text-gray-500 mb-5">Choose what you need help with.</p>

      <div className="grid grid-cols-2 gap-3">
        {categories.map(({ value, label, desc, Icon, color, bg }) => {
          const isMore = value === "more";
          return (
            <button
              key={value}
              onClick={() => !isMore && onSelect(value as JobCategory)}
              disabled={isMore}
              className={`
                flex flex-col items-center gap-2.5 rounded-2xl border-2 py-5 px-3
                transition-all duration-150 cursor-pointer bg-white
                ${isMore ? "opacity-40 cursor-not-allowed border-gray-100" : "border-gray-200 hover:border-cobalt/40 hover:shadow-md hover:-translate-y-0.5"}
              `}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
                <Icon size={19} className={color} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold leading-none text-gray-800">{label}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
