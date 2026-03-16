import { useState } from "react";
import { Star, Loader2, X } from "lucide-react";

interface Props {
  roleLabel: string; // "your pro" or "your client"
  onSubmit: (rating: number, comment: string) => Promise<void>;
  onDismiss: () => void;
  submitting: boolean;
}

export function RatingModal({ roleLabel, onSubmit, onDismiss, submitting }: Props) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        style={{ animation: "fade-in-up 0.3s ease-out both" }}
      >
        <button
          onClick={onDismiss}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 cursor-pointer"
        >
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-gray-900 text-center">
          How was your experience?
        </h3>
        <p className="mt-1 text-sm text-gray-500 text-center">
          Rate {roleLabel}
        </p>

        {/* Stars */}
        <div className="mt-5 flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              className="cursor-pointer p-1 transition-transform hover:scale-110"
            >
              <Star
                size={32}
                className={
                  n <= (hover || rating)
                    ? "fill-amber-400 text-amber-400"
                    : "text-gray-300"
                }
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Leave a comment (optional)"
          rows={3}
          className="mt-4 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 placeholder:text-gray-400 outline-none transition focus:border-cobalt focus:ring-2 focus:ring-cobalt/20 resize-none"
        />

        {/* Actions */}
        <button
          onClick={() => onSubmit(rating, comment)}
          disabled={rating === 0 || submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cobalt py-3.5 text-sm font-semibold text-white shadow-lg shadow-cobalt/25 transition hover:bg-cobalt-dark cursor-pointer disabled:opacity-40"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : "Submit Review"}
        </button>
        <button
          onClick={onDismiss}
          className="mt-2 w-full text-center text-sm text-gray-400 hover:text-gray-600 cursor-pointer py-2"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
