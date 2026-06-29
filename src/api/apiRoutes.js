const BASE_URL = "http://localhost:4000/api";
export const IMAGE_BASE_URL = "http://localhost:4000/uploads";

export const API_ROUTES = {
  // Authentication
  AUTH: {
    LOGIN: `${BASE_URL}/auth/login`,
    SIGNUP: `${BASE_URL}/auth/signup`,
    USER_PROFILE: `${BASE_URL}/auth/profile`,
    GET_PUBLIC_PROFILE: (userId) => `${BASE_URL}/auth/users/${userId}/profile`,
  },

  // Password Management
  PASSWORD: {
    FORGOT: `${BASE_URL}/password/forgot`,
    RESET: `${BASE_URL}/password/reset`,
  },

  // Accommodations (Properties)
  ACCOMMODATIONS: {
    ALL: `${BASE_URL}/accommodations/all-properties`,
    GET_BY_ID: (id) => `${BASE_URL}/accommodations/get-property/${id}`,
    CREATE: `${BASE_URL}/accommodations/create-property`,
    UPDATE: (id) => `${BASE_URL}/accommodations/update-property/${id}`,
    DELETE: (id) => `${BASE_URL}/accommodations/delete-property/${id}`,
    MY_PROPERTIES: `${BASE_URL}/accommodations/my-properties`,
  },

  // Chat
  CHAT: {
    BASE: `${BASE_URL}/chat`,
    GET_MESSAGES: (productId, senderId, receiverId) =>
      `${BASE_URL}/chat/${productId}/${senderId}/${receiverId}`,
  },

  // Visits
  VISITS: {
    REQUEST: `${BASE_URL}/visits/request-visit`,
    MY_VISITS: `${BASE_URL}/visits/my-visits`,
    GET_BY_PROPERTY: (propertyId) =>
      `${BASE_URL}/visits/owner-visits/${propertyId}`,
    UPDATE_STATUS: (visitId) =>
      `${BASE_URL}/visits/update-visit-status/${visitId}`,
    CANCEL: (visitId) => `${BASE_URL}/visits/cancel-visit/${visitId}`,
  },

  // BOOKINGS
  BOOKING: {
    CREATE: `${BASE_URL}/bookings`,
    MY_BOOKINGS: `${BASE_URL}/bookings/my-bookings`,
    BY_PROPERTY: (propertyId) => `${BASE_URL}/bookings/property/${propertyId}`,
    UPDATE: (bookingId) => `${BASE_URL}/bookings/update-property/${bookingId}`, // ← fix
    DELETE: (bookingId) => `${BASE_URL}/bookings/delete-booking/${bookingId}`, // ← fix
    APPROVE: (bookingId) => `${BASE_URL}/bookings/approve/${bookingId}`,
    REJECT: (bookingId) => `${BASE_URL}/bookings/reject/${bookingId}`,
  },

  SHORTLIST: {
    ADD: `${BASE_URL}/shortlist/add`,
    GET: `${BASE_URL}/shortlist/my-shortlist`,
    REMOVE: (propertyId) => `${BASE_URL}/shortlist/remove/${propertyId}`,
  },

  AGREEMENT: {
    // GET  — fetch agreement for a booking (tenant or owner)
    GET_BY_BOOKING: (bookingId) =>
      `${BASE_URL}/agreements/booking/${bookingId}`,

    // POST — tenant signs
    TENANT_SIGN: (agreementId) =>
      `${BASE_URL}/agreements/${agreementId}/tenant-sign`,

    // POST — owner countersigns
    OWNER_SIGN: (agreementId) =>
      `${BASE_URL}/agreements/${agreementId}/owner-sign`,
  },

  // PAYMENT
  PAYMENT: {
    CREATE_INTENT: `${BASE_URL}/payments/create-intent`, // POST   — matches paymentRoutes mount
  },

  // STRIPE
  STRIPE: {
    WEBHOOK: `${BASE_URL}/stripe/webhook`,
  },
  REVIEW: {
    CREATE: `${BASE_URL}/reviews`,
    BY_PROPERTY: (propertyId) => `${BASE_URL}/reviews/property/${propertyId}`,
    BY_OWNER: (ownerId) => `${BASE_URL}/reviews/owner/${ownerId}`,
    // Admin only
    // ADMIN_ALL: `${BASE_URL}/reviews/admin/all`,
    // SET_VISIBILITY: (reviewId) => `${BASE_URL}/reviews/${reviewId}/hide`,
  },

  MAINTENANCE: {
    // Tenant
    CREATE: `${BASE_URL}/maintenance`,
    MY_REQUESTS: `${BASE_URL}/maintenance/my-requests`,
    GET_BY_ID: (id) => `${BASE_URL}/maintenance/${id}`,
    ADD_COMMENT: (id) => `${BASE_URL}/maintenance/${id}/comment`,
    HIRE_TECHNICIAN: (id) => `${BASE_URL}/maintenance/${id}/hire-technician`,
    SUBMIT_PROOF: (id) => `${BASE_URL}/maintenance/${id}/submit-proof`,
    REQUEST_HELPER: (id) => `${BASE_URL}/maintenance/${id}/request-helper`,
    RESPOND_HELPER: (id) => `${BASE_URL}/maintenance/${id}/respond-helper`,
    COMPLETE_HELPER: (id) => `${BASE_URL}/maintenance/${id}/complete-helper`,

    CONFIRM_WORK: (id) => `${BASE_URL}/maintenance/${id}/confirm-work`,
    // Owner
    ALL: `${BASE_URL}/maintenance`,
    ASSIGN: (id) => `${BASE_URL}/maintenance/${id}/assign`,
    UPDATE_STATUS: (id) => `${BASE_URL}/maintenance/${id}/status`,
    REVIEW_PROOF: (id) => `${BASE_URL}/maintenance/${id}/review-proof`,
    OWNER_REQUESTS: `${BASE_URL}/maintenance/owner-requests`,
  },
};