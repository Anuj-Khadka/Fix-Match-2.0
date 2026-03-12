import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Briefcase,
  MapPin,
  FileText,
  CheckCircle,
  Upload,
  ChevronRight,
  ChevronLeft,
  Wrench,
  Zap,
  Wind,
  Hammer,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ProviderData {
  business_name: string;
  years_of_experience: number;
  bio: string;
  service_categories: string[];
  service_radius: number;
  base_rate: string;
  id_document_url: string;
  license_document_url: string;
}

const EMPTY_DATA: ProviderData = {
  business_name: "",
  years_of_experience: 0,
  bio: "",
  service_categories: [],
  service_radius: 25,
  base_rate: "",
  id_document_url: "",
  license_document_url: "",
};

const STEPS = [
  { label: "Personal Info", icon: User },
  { label: "Services", icon: Briefcase },
  { label: "Preferences", icon: MapPin },
  { label: "Documents", icon: FileText },
];

const CATEGORIES = [
  { value: "plumbing", label: "Plumbing", icon: Wrench },
  { value: "electrical", label: "Electrical", icon: Zap },
  { value: "hvac", label: "HVAC", icon: Wind },
  { value: "handyman", label: "Handyman", icon: Hammer },
];

const inputClass =
  "mt-1 block w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20";

/* ------------------------------------------------------------------ */
/*  Step Indicator                                                     */
/* ------------------------------------------------------------------ */

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const Icon = step.icon;
        return (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition ${
                  done
                    ? "bg-cobalt text-white"
                    : active
                      ? "border-2 border-cobalt bg-cobalt/10 text-cobalt"
                      : "border-2 border-gray-200 bg-white text-gray-400"
                }`}
              >
                {done ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
              </div>
              <span
                className={`mt-1.5 text-xs font-medium ${
                  done || active ? "text-cobalt" : "text-gray-400"
                }`}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`mx-2 h-0.5 w-12 rounded ${
                  i < current ? "bg-cobalt" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 1 — Personal Info                                             */
/* ------------------------------------------------------------------ */

function Step1({
  data,
  onChange,
  onNext,
}: {
  data: ProviderData;
  onChange: (d: Partial<ProviderData>) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data.business_name.trim()) {
      setError("Business name is required.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Tell us about yourself</h2>
        <p className="mt-1 text-sm text-gray-500">Basic information about your business</p>
      </div>

      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
          Business Name <span className="text-red-500">*</span>
        </label>
        <input
          id="businessName"
          type="text"
          value={data.business_name}
          onChange={(e) => onChange({ business_name: e.target.value })}
          placeholder="e.g. Smith Plumbing Services"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="experience" className="block text-sm font-medium text-gray-700">
          Years of Experience
        </label>
        <input
          id="experience"
          type="number"
          min={0}
          max={50}
          value={data.years_of_experience}
          onChange={(e) => onChange({ years_of_experience: Number(e.target.value) })}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
          Professional Bio
        </label>
        <textarea
          id="bio"
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value.slice(0, 500) })}
          rows={4}
          placeholder="Tell clients about your experience and what makes you great at what you do..."
          className={inputClass + " resize-none"}
        />
        <p className="mt-1 text-xs text-gray-400">{data.bio.length}/500</p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end">
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 2 — Services                                                  */
/* ------------------------------------------------------------------ */

function Step2({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: ProviderData;
  onChange: (d: Partial<ProviderData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");

  function toggle(cat: string) {
    const cats = data.service_categories.includes(cat)
      ? data.service_categories.filter((c) => c !== cat)
      : [...data.service_categories, cat];
    onChange({ service_categories: cats });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (data.service_categories.length === 0) {
      setError("Select at least one service category.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">What services do you offer?</h2>
        <p className="mt-1 text-sm text-gray-500">Select all categories that apply</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {CATEGORIES.map((cat) => {
          const selected = data.service_categories.includes(cat.value);
          const Icon = cat.icon;
          return (
            <button
              key={cat.value}
              type="button"
              onClick={() => toggle(cat.value)}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 px-4 py-5 text-sm font-medium transition ${
                selected
                  ? "border-cobalt bg-cobalt/5 text-cobalt"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              <Icon className="h-6 w-6" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 3 — Work Preferences                                         */
/* ------------------------------------------------------------------ */

function Step3({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: ProviderData;
  onChange: (d: Partial<ProviderData>) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const [error, setError] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data.service_radius || data.service_radius < 1) {
      setError("Service radius must be at least 1 mile.");
      return;
    }
    if (!data.base_rate || Number(data.base_rate) <= 0) {
      setError("Please enter a valid base rate.");
      return;
    }
    setError("");
    onNext();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Work Preferences</h2>
        <p className="mt-1 text-sm text-gray-500">Set your service area and pricing</p>
      </div>

      <div>
        <label htmlFor="radius" className="block text-sm font-medium text-gray-700">
          Service Radius <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <input
            id="radius"
            type="number"
            min={1}
            max={100}
            value={data.service_radius}
            onChange={(e) => onChange({ service_radius: Number(e.target.value) })}
            className={inputClass + " pr-14"}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
            miles
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="rate" className="block text-sm font-medium text-gray-700">
          Base Rate (per hour) <span className="text-red-500">*</span>
        </label>
        <div className="relative mt-1">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
          <input
            id="rate"
            type="number"
            min={0}
            step={0.01}
            value={data.base_rate}
            onChange={(e) => onChange({ base_rate: e.target.value })}
            placeholder="0.00"
            className={inputClass + " pl-8"}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-xl bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
        >
          Next <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Step 4 — Document Upload                                           */
/* ------------------------------------------------------------------ */

function Step4({
  data,
  onChange,
  onSubmit,
  onBack,
  saving,
}: {
  data: ProviderData;
  onChange: (d: Partial<ProviderData>) => void;
  onSubmit: () => void;
  onBack: () => void;
  saving: boolean;
}) {
  const { user } = useAuth();
  const [error, setError] = useState("");
  const [govFileName, setGovFileName] = useState("");
  const [licFileName, setLicFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file: File, type: "gov-id" | "license") {
    if (!user) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${type}.${ext}`;

    setUploading(true);
    const { error: uploadError } = await supabase.storage
      .from("provider-docs")
      .upload(path, file, { upsert: true });
    setUploading(false);

    if (uploadError) {
      setError(`Upload failed: ${uploadError.message}`);
      return;
    }

    if (type === "gov-id") {
      onChange({ id_document_url: path });
      setGovFileName(file.name);
    } else {
      onChange({ license_document_url: path });
      setLicFileName(file.name);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!data.id_document_url) {
      setError("Please upload your Government ID.");
      return;
    }
    if (!data.license_document_url) {
      setError("Please upload your Professional License.");
      return;
    }
    setError("");
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Upload Documents</h2>
        <p className="mt-1 text-sm text-gray-500">
          We need these to verify your identity and qualifications
        </p>
      </div>

      {/* Government ID */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Government ID <span className="text-red-500">*</span>
        </label>
        <label
          className={`mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            data.id_document_url
              ? "border-cobalt bg-cobalt/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <Upload className={`h-8 w-8 ${data.id_document_url ? "text-cobalt" : "text-gray-400"}`} />
          <span className="text-sm text-gray-600">
            {govFileName || (data.id_document_url ? "File uploaded" : "Click to upload")}
          </span>
          <span className="text-xs text-gray-400">PDF, JPG, or PNG (max 5 MB)</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                setError("File must be under 5 MB.");
                return;
              }
              uploadFile(file, "gov-id");
            }}
          />
        </label>
      </div>

      {/* Professional License */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Professional License <span className="text-red-500">*</span>
        </label>
        <label
          className={`mt-1 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
            data.license_document_url
              ? "border-cobalt bg-cobalt/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <Upload
            className={`h-8 w-8 ${data.license_document_url ? "text-cobalt" : "text-gray-400"}`}
          />
          <span className="text-sm text-gray-600">
            {licFileName || (data.license_document_url ? "File uploaded" : "Click to upload")}
          </span>
          <span className="text-xs text-gray-400">PDF, JPG, or PNG (max 5 MB)</span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024) {
                setError("File must be under 5 MB.");
                return;
              }
              uploadFile(file, "license");
            }}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Back
        </button>
        <button
          type="submit"
          disabled={saving || uploading}
          className="flex items-center gap-2 rounded-xl bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark disabled:opacity-50 cursor-pointer border-none"
        >
          {saving ? "Submitting..." : "Submit Application"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/*  Success Screen                                                     */
/* ------------------------------------------------------------------ */

function OnboardingComplete() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-gray-900">Application Submitted!</h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Your profile is under review. We'll notify you by email once your account has been approved.
      </p>
      <button
        onClick={() => navigate("/pending-approval")}
        className="mt-8 rounded-xl bg-cobalt px-6 py-3 text-sm font-semibold text-white transition hover:bg-cobalt-dark cursor-pointer border-none"
      >
        Go to Status Page
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Onboarding Component                                          */
/* ------------------------------------------------------------------ */

export function ProviderOnboarding() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<ProviderData>(EMPTY_DATA);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Load existing data on mount (resume support)
  useEffect(() => {
    if (!user) return;

    supabase
      .from("provider_profiles")
      .select(
        "business_name, years_of_experience, bio, service_categories, service_radius, base_rate, id_document_url, license_document_url, onboarding_step"
      )
      .eq("id", user.id)
      .single()
      .then(({ data: row }) => {
        if (row) {
          setStep(row.onboarding_step ?? 0);
          setData({
            business_name: row.business_name ?? "",
            years_of_experience: row.years_of_experience ?? 0,
            bio: row.bio ?? "",
            service_categories: row.service_categories ?? [],
            service_radius: row.service_radius ?? 25,
            base_rate: row.base_rate ? String(row.base_rate) : "",
            id_document_url: row.id_document_url ?? "",
            license_document_url: row.license_document_url ?? "",
          });
        }
        setInitialLoading(false);
      });
  }, [user]);

  function updateData(partial: Partial<ProviderData>) {
    setData((prev) => ({ ...prev, ...partial }));
  }

  async function saveStep(fields: Record<string, unknown>, nextStep: number) {
    if (!user) return;
    setSaving(true);
    setError("");

    const { error: dbError } = await supabase
      .from("provider_profiles")
      .update({ ...fields, onboarding_step: nextStep })
      .eq("id", user.id);

    setSaving(false);
    if (dbError) {
      setError(`Save failed: ${dbError.message}`);
      return;
    }

    setStep(nextStep);
  }

  async function handleFinalSubmit() {
    await saveStep(
      {
        id_document_url: data.id_document_url,
        license_document_url: data.license_document_url,
        onboarding_step: 4,
        status: "pending_review",
      },
      4
    );
    await refreshProfile();
  }

  if (initialLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f9fafb] font-sans">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <span className="text-2xl font-extrabold tracking-tight text-cobalt">
          fix<span className="text-gray-900">match</span>
        </span>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          {/* Progress indicator */}
          {step < 4 && (
            <div className="mb-8">
              <StepIndicator current={step} />
            </div>
          )}

          {/* Step card */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            {error && (
              <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
            )}

            {step === 0 && <Step1 data={data} onChange={updateData} onNext={() => saveStep({ business_name: data.business_name, years_of_experience: data.years_of_experience, bio: data.bio }, 1)} />}
            {step === 1 && <Step2 data={data} onChange={updateData} onNext={() => saveStep({ service_categories: data.service_categories }, 2)} onBack={() => setStep(0)} />}
            {step === 2 && <Step3 data={data} onChange={updateData} onNext={() => saveStep({ service_radius: data.service_radius, base_rate: Number(data.base_rate) }, 3)} onBack={() => setStep(1)} />}
            {step === 3 && <Step4 data={data} onChange={updateData} onSubmit={handleFinalSubmit} onBack={() => setStep(2)} saving={saving} />}
            {step >= 4 && <OnboardingComplete />}
          </div>
        </div>
      </main>
    </div>
  );
}
