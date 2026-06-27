export default function StarRatingInput({ label, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-gray-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`text-2xl leading-none transition-colors ${
              star <= value ? "text-yellow-500" : "text-gray-300"
            }`}
            aria-label={`${star} star`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );
}
