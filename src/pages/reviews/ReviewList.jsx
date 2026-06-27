import { useEffect, useState } from "react";
import { getPropertyReviews, getOwnerReviews } from "../../service/reviews";

function Stars({ value }) {
  return (
    <span className="text-yellow-500 text-sm">
      {"★".repeat(Math.round(value))}
      <span className="text-gray-300">{"★".repeat(5 - Math.round(value))}</span>
    </span>
  );
}

function ReviewCard({ review }) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-3">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">
          {review.reviewer?.name || "Anonymous"}
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            review.reviewStage === "mid_stay"
              ? "bg-amber-100 text-amber-700"
              : "bg-green-100 text-green-700"
          }`}
        >
          {review.reviewStage === "mid_stay" ? "Mid-stay" : "Completed stay"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm mb-2">
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Place</span>
          <Stars value={review.propertyAvg} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">Owner</span>
          <Stars value={review.ownerAvg} />
        </div>
      </div>

      {review.comment && (
        <p className="text-sm text-gray-700 mt-2">{review.comment}</p>
      )}

      <p className="text-xs text-gray-400 mt-2">
        {new Date(review.createdAt).toLocaleDateString()}
      </p>
    </div>
  );
}

export default function ReviewList({ type, id }) {
  // type: "property" | "owner"
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFn = type === "owner" ? getOwnerReviews : getPropertyReviews;
    fetchFn(id)
      .then(setReviews)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [type, id]);

  if (loading)
    return <p className="text-sm text-gray-500">Loading reviews...</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (reviews.length === 0)
    return <p className="text-sm text-gray-500">No reviews yet.</p>;

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        {reviews.length} review{reviews.length !== 1 ? "s" : ""}
      </h3>
      {reviews.map((r) => (
        <ReviewCard key={r._id} review={r} />
      ))}
    </div>
  );
}
