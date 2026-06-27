import { useState } from "react";
import StarRatingInput from "./StarRatingInput";
import { submitReview } from "../../service/reviews";

const DEFAULT_RATINGS = {
  property: { accuracy: 0, cleanliness: 0, valueForMoney: 0 },
  owner: { communication: 0, responsiveness: 0, respectfulBehavior: 0 },
};

export default function ReviewForm({ bookingId, onSuccess }) {
  const [ratings, setRatings] = useState(DEFAULT_RATINGS);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const setPropertyRating = (key, val) =>
    setRatings((prev) => ({
      ...prev,
      property: { ...prev.property, [key]: val },
    }));

  const setOwnerRating = (key, val) =>
    setRatings((prev) => ({
      ...prev,
      owner: { ...prev.owner, [key]: val },
    }));

  const allRated = () =>
    Object.values(ratings.property).every((v) => v > 0) &&
    Object.values(ratings.owner).every((v) => v > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!allRated()) {
      setError("Please rate every category before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const review = await submitReview({
        bookingId,
        propertyRatings: ratings.property,
        ownerRatings: ratings.owner,
        comment,
      });
      onSuccess?.(review);
      setRatings(DEFAULT_RATINGS);
      setComment("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 p-5 bg-gray-50"
    >
      <h3 className="text-sm font-bold text-gray-900 mb-1">Leave a review</h3>
      <p className="text-xs text-gray-500 mb-4">
        Rate the place and the owner separately — both help future tenants.
      </p>

      <div className="mb-4">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
          About the place
        </h4>
        <StarRatingInput
          label="Matches photos/description"
          value={ratings.property.accuracy}
          onChange={(v) => setPropertyRating("accuracy", v)}
        />
        <StarRatingInput
          label="Cleanliness"
          value={ratings.property.cleanliness}
          onChange={(v) => setPropertyRating("cleanliness", v)}
        />
        <StarRatingInput
          label="Value for money"
          value={ratings.property.valueForMoney}
          onChange={(v) => setPropertyRating("valueForMoney", v)}
        />
      </div>

      <div className="mb-4 border-t border-gray-200 pt-3">
        <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-1">
          About the owner
        </h4>
        <StarRatingInput
          label="Communication"
          value={ratings.owner.communication}
          onChange={(v) => setOwnerRating("communication", v)}
        />
        <StarRatingInput
          label="Responsiveness to issues"
          value={ratings.owner.responsiveness}
          onChange={(v) => setOwnerRating("responsiveness", v)}
        />
        <StarRatingInput
          label="Respectful behavior"
          value={ratings.owner.respectfulBehavior}
          onChange={(v) => setOwnerRating("respectfulBehavior", v)}
        />
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Anything else future tenants should know?"
        maxLength={2000}
        rows={3}
        className="w-full border border-gray-300 rounded-xl p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary mb-3"
      />

      {error && (
        <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-lg p-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-primary text-white rounded-xl py-2.5 text-sm font-bold hover:bg-primary-dark disabled:opacity-50 transition-all active:scale-95"
      >
        {submitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
