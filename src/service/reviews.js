import axios from "axios";
import { API_ROUTES } from "../api/apiRoutes";

const authHeader = () => ({
  authorization: `Bearer ${localStorage.getItem("token")}`,
});

export async function submitReview(payload) {
  const res = await axios.post(API_ROUTES.REVIEW.CREATE, payload, {
    headers: authHeader(),
  });
  return res.data.review;
}

export async function getPropertyReviews(propertyId) {
  const res = await axios.get(API_ROUTES.REVIEW.BY_PROPERTY(propertyId));
  return res.data.reviews;
}

export async function getOwnerReviews(ownerId) {
  const res = await axios.get(API_ROUTES.REVIEW.BY_OWNER(ownerId));
  return res.data.reviews;
}

export async function getAllReviewsForAdmin() {
  const res = await axios.get(API_ROUTES.REVIEW.ADMIN_ALL, {
    headers: authHeader(),
  });
  return res.data.reviews;
}

export async function setReviewVisibility(reviewId, hidden) {
  const res = await axios.patch(
    API_ROUTES.REVIEW.SET_VISIBILITY(reviewId),
    { hidden },
    { headers: authHeader() },
  );
  return res.data.review;
}
