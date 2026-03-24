import { ArrowLeft } from "lucide-react";
import { StepHero } from "./StepHero";
import { StepServiceSelect } from "./StepServiceSelect";
import { StepDescription } from "./StepDescription";
import { StepLocation } from "./StepLocation";
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
  onSubmit: () => void;
  submitting: boolean;
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
  onSubmit,
  submitting,
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
      <div className={`relative min-h-[400px] ${step === 4 ? "overflow-visible" : "overflow-hidden"}`}>
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

        {/* Step 4 — Checkpoint */}
        <div
          className={`${step === 4 ? "relative p-6 flex items-center justify-center" : "absolute inset-0 p-6 flex items-center justify-center"} transition-all duration-300 ease-in-out ${stepClass(4)}`}
        >
          <StepCheckpoint
            category={data.category}
            description={data.description}
            address={data.address}
            imageCount={data.images.length}
            onConfirm={onSubmit}
            submitting={submitting}
            error={submitError}
          />
        </div>
      </div>
    </div>
  );
}
