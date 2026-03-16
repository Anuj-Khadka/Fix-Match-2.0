import { useRef, useEffect } from "react";
import { ImagePlus, X, ArrowRight } from "lucide-react";

interface Props {
  description: string;
  onDescriptionChange: (val: string) => void;
  images: File[];
  imagePreviews: string[];
  onImagesChange: (files: File[], previews: string[]) => void;
  onNext: () => void;
}

export function StepDescription({
  description,
  onDescriptionChange,
  images,
  imagePreviews,
  onImagesChange,
  onNext,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    const remaining = 3 - images.length;
    const newFiles = selected.slice(0, remaining);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));
    onImagesChange([...images, ...newFiles], [...imagePreviews, ...newPreviews]);
    // Reset input so re-selecting same file works
    e.target.value = "";
  }

  function removeImage(idx: number) {
    URL.revokeObjectURL(imagePreviews[idx]);
    onImagesChange(
      images.filter((_, i) => i !== idx),
      imagePreviews.filter((_, i) => i !== idx)
    );
  }

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-bold text-gray-900 mb-1">Describe the issue</h3>
      <p className="text-sm text-gray-500 mb-4">Help your pro understand the job.</p>

      <textarea
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
        placeholder="e.g., Leaky faucet in the kitchen, dripping constantly..."
        rows={4}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 resize-none"
      />

      {/* Image upload */}
      <div className="mt-4">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFiles}
        />

        {/* Thumbnails */}
        <div className="flex gap-2 flex-wrap">
          {imagePreviews.map((src, i) => (
            <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
              <img src={src} alt={`Upload ${i + 1}`} className="w-full h-full object-cover" />
              <button
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 flex items-center justify-center rounded-full bg-gray-900/70 text-white cursor-pointer border-none"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {images.length < 3 && (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-cobalt hover:text-cobalt transition cursor-pointer bg-transparent"
            >
              <ImagePlus size={20} />
            </button>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mt-1.5">
          Add up to 3 photos (optional)
        </p>
      </div>

      {/* Next */}
      <button
        onClick={onNext}
        className="mt-auto flex items-center justify-center gap-2 w-full rounded-2xl bg-cobalt py-3.5 text-sm font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark hover:scale-[1.02] active:scale-[0.98] cursor-pointer border-none"
      >
        Next <ArrowRight size={16} />
      </button>
    </div>
  );
}
