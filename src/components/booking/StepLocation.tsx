import { useEffect, useRef, useState } from "react";
import { MapPin, Loader2, LocateFixed, ArrowRight } from "lucide-react";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

interface Props {
  address: string;
  onAddressChange: (val: string) => void;
  onCoordsChange: (lat: number, lng: number, address: string) => void;
  requestPosition: () => Promise<{ lat: number; lng: number }>;
  geoLoading: boolean;
  geoError: string | null;
  onNext: () => void;
  canProceed: boolean;
}

export function StepLocation({
  address,
  onAddressChange,
  onCoordsChange,
  requestPosition,
  geoLoading,
  geoError,
  onNext,
  canProceed,
}: Props) {
  const [locating, setLocating] = useState(false);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleInputChange(val: string) {
    onAddressChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(val)}&countrycodes=us&addressdetails=1&limit=5`
        );
        const results: NominatimResult[] = await res.json();
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }

  function selectSuggestion(result: NominatimResult) {
    onCoordsChange(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  async function handleUseCurrentLocation() {
    setLocating(true);
    try {
      const coords = await requestPosition();
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}`
      );
      const data = await res.json();
      const a = data.address ?? {};
      const street = [a.house_number, a.road].filter(Boolean).join(" ");
      const city = a.city ?? a.town ?? a.village ?? "";
      const resolved = [street, city].filter(Boolean).join(", ") || "Current Location";
      onCoordsChange(coords.lat, coords.lng, resolved);
    } catch {
      // errors surfaced via geoError
    } finally {
      setLocating(false);
    }
  }

  const isLoading = geoLoading || locating;

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Your location</h3>
      <p className="text-sm text-gray-500 mb-5">Where should the pro come?</p>

      {/* Address input with autocomplete */}
      <div className="relative" ref={wrapperRef}>
        <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10" />
        <input
          type="text"
          value={address}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder="Enter your address..."
          className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pr-4 pl-10 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20"
          autoComplete="off"
        />

        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {suggestions.map((s, i) => (
              <li key={i}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent input blur before click registers
                    selectSuggestion(s);
                  }}
                  className="w-full flex items-start gap-2.5 px-4 py-2.5 text-left text-sm hover:bg-cobalt/5 transition cursor-pointer border-none bg-white"
                >
                  <MapPin size={14} className="text-cobalt shrink-0 mt-0.5" />
                  <span className="text-gray-700 leading-snug">{s.display_name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Use current location */}
      <button
        onClick={handleUseCurrentLocation}
        disabled={isLoading}
        className="mt-3 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition hover:border-cobalt hover:text-cobalt cursor-pointer disabled:opacity-50 w-full"
      >
        {isLoading ? (
          <Loader2 size={16} className="animate-spin text-cobalt" />
        ) : (
          <LocateFixed size={16} className="text-cobalt" />
        )}
        {isLoading ? "Getting your location..." : "Use Current Location"}
      </button>

      {/* Error */}
      {geoError && (
        <p className="mt-3 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2.5 border border-red-100">
          {geoError}
        </p>
      )}

      {/* Next */}
      <button
        onClick={onNext}
        disabled={!canProceed}
        className="mt-auto flex items-center justify-center gap-2 w-full rounded-2xl bg-cobalt py-3.5 text-sm font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none disabled:opacity-40"
      >
        Next <ArrowRight size={16} />
      </button>
    </div>
  );
}
