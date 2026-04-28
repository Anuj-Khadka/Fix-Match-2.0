import { ArrowLeft } from "lucide-react";
import { StepHero } from "./StepHero";
import { StepServiceSelect } from "./StepServiceSelect";
import { StepDescription } from "./StepDescription";
import { StepLocation } from "./StepLocation";
import { StepSchedule, type ScheduleType } from "./StepSchedule";
import { StepCheckpoint } from "./StepCheckpoint";
import type { JobCategory } from "../../hooks/useJobs";

export interface BookingData {
  category: JobCategory | null;
  description: string;
  images: File[];
  imagePreviews: string[];
  lat: number | null;
  lng: number | null;
  address: string;
  scheduleType: ScheduleType | null;
  scheduledAt: string | null;
}

interface CategoryItem {
  value: JobCategory | "more";
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
}

interface Props {
  step: number;
  setStep: (s: number) => void;
  data: BookingData;
  setData: React.Dispatch<React.SetStateAction<BookingData>>;
  categories: CategoryItem[];
  requestPosition: () => Promise<{ lat: number; lng: number }>;
  geoLoading: boolean;
  geoError: string | null;
  onFindProviders: () => void;
  findingProviders: boolean;
  submitError: string | null;
}

export function BookingPanel({
  step,
  setStep,
  data,
  setData,
  categories,
  requestPosition,
  geoLoading,
  geoError,
  onFindProviders,
  findingProviders,
  submitError,
}: Props) {
  function stepClass(idx: number) {
    if (idx === step) return "translate-x-0 opacity-100";
    if (idx < step) return "-translate-x-full opacity-0";
    return "translate-x-full opacity-0";
  }

  return (
    <div className="w-full max-w-xl rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/15 overflow-hidden transition-all duration-300">
      {/* Back arrow */}
      {step >= 1 && (
        <div className="px-5 pt-4">
          <button
            onClick={() => setStep(step - 1)}
            className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-cobalt transition cursor-pointer bg-transparent border-none"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      )}

      {/* Step container */}
      <div className={`relative min-h-[400px] ${step === 4 || step === 5 ? "overflow-visible" : "overflow-hidden"}`}>
        {/* Step 0 — Hero */}
        <div className={`absolute inset-0 p-6 flex items-center justify-center transition-all duration-300 ease-in-out ${stepClass(0)}`}>
          <StepHero onStart={() => setStep(1)} />
        </div>

        {/* Step 1 — Service Select */}
        <div className={`absolute inset-0 p-6 transition-all duration-300 ease-in-out ${stepClass(1)}`}>
          <StepServiceSelect
            categories={categories}
            onSelect={(cat) => {
              setData((d) => ({ ...d, category: cat }));
              setStep(2);
            }}
          />
        </div>

        {/* Step 2 — Description */}
        <div className={`absolute inset-0 p-6 flex flex-col transition-all duration-300 ease-in-out ${stepClass(2)}`}>
          <StepDescription
            description={data.description}
            onDescriptionChange={(val) => setData((d) => ({ ...d, description: val }))}
            images={data.images}
            imagePreviews={data.imagePreviews}
            onImagesChange={(files, previews) =>
              setData((d) => ({ ...d, images: files, imagePreviews: previews }))
            }
            onNext={() => setStep(3)}
          />
        </div>

        {/* Step 3 — Location */}
        <div className={`absolute inset-0 p-6 flex flex-col transition-all duration-300 ease-in-out ${stepClass(3)}`}>
          <StepLocation
            address={data.address}
            onAddressChange={(val) => setData((d) => ({ ...d, address: val }))}
            onCoordsChange={(lat, lng, address) =>
              setData((d) => ({ ...d, lat, lng, address }))
            }
            requestPosition={requestPosition}
            geoLoading={geoLoading}
            geoError={geoError}
            onNext={() => setStep(4)}
            canProceed={!!(data.address.trim() || (data.lat && data.lng))}
          />
        </div>

        {/* Step 4 — Schedule */}
        <div className={`${step === 4 ? "relative p-6 flex flex-col" : "absolute inset-0 p-6 flex flex-col"} transition-all duration-300 ease-in-out ${stepClass(4)}`}>
          <StepSchedule
            scheduleType={data.scheduleType}
            scheduledAt={data.scheduledAt}
            onChange={(type, at) => setData((d) => ({ ...d, scheduleType: type, scheduledAt: at }))}
            onNext={() => setStep(5)}
          />
        </div>

        {/* Step 5 — Review & Confirm */}
        <div className={`${step === 5 ? "relative p-6 flex items-center justify-center" : "absolute inset-0 p-6 flex items-center justify-center"} transition-all duration-300 ease-in-out ${stepClass(5)}`}>
          <StepCheckpoint
            category={data.category}
            description={data.description}
            address={data.address}
            imageCount={data.images.length}
            scheduleType={data.scheduleType}
            scheduledAt={data.scheduledAt}
            onConfirm={onFindProviders}
            submitting={findingProviders}
            error={submitError}
          />
        </div>
      </div>
    </div>
  );
}
