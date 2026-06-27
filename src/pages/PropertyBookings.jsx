import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaCheck,
  FaTimes,
  FaUser,
  FaArrowLeft,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaCalendarAlt,
  FaShieldAlt,
  FaVenusMars,
  FaMoneyBillWave,
  FaInfoCircle,
  FaFileContract,
  FaCheckCircle,
  FaHourglassHalf,
  FaRedoAlt,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes";
import AgreementModal from "../pages/AgreementModal";

const PropertyBookings = () => {
  const { propertyId } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Agreement state ───────────────────────────────────────────────────────
  // Key presence meaning:
  //   key absent      → fetch not yet attempted (shows "Loading agreement...")
  //   key = null      → fetch attempted but failed after retry (shows retry button)
  //   key = object    → agreement loaded successfully
  const [agreements, setAgreements] = useState({});
  const [activeAgreement, setActiveAgreement] = useState(null);

  const authHeader = {
    authorization: `Bearer ${localStorage.getItem("token")}`,
  };

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  const fetchBookings = async () => {
    try {
      showLoader();
      const res = await axios.get(API_ROUTES.BOOKING.BY_PROPERTY(propertyId), {
        headers: authHeader,
      });
      const list = res.data.data || [];
      setBookings(list);

      // For every approved booking, fetch its agreement
      const approvedIds = list
        .filter((b) => b.status === "approved")
        .map((b) => b._id);

      if (approvedIds.length > 0) {
        const results = await Promise.allSettled(
          approvedIds.map((id) =>
            axios
              .get(API_ROUTES.AGREEMENT.GET_BY_BOOKING(id), {
                headers: authHeader,
              })
              .then((r) => ({ bookingId: id, data: r.data.data })),
          ),
        );
        const map = {};
        results.forEach((r) => {
          if (r.status === "fulfilled") {
            // Successful fetch → store the agreement object
            map[r.value.bookingId] = r.value.data;
          } else {
            // Failed fetch → store null so the UI shows a retry button
            // We need to extract the bookingId from the reason if possible
            // Promise.allSettled doesn't give us the id directly on failure,
            // so we match by index
          }
        });

        // Build map properly, marking failures as null
        approvedIds.forEach((id, idx) => {
          const result = results[idx];
          if (result.status === "fulfilled") {
            map[id] = result.value.data;
          } else {
            map[id] = null;
          }
        });

        setAgreements(map);
      }
    } catch (err) {
      console.error(err);
      showAlert("Failed to load bookings", "error");
    } finally {
      setLoading(false);
      hideLoader();
    }
  };

  // ── Fetch agreement for a single booking, with one retry on 404 ───────────
  const fetchAgreementForBooking = (bookingId, attempt = 0) => {
    axios
      .get(API_ROUTES.AGREEMENT.GET_BY_BOOKING(bookingId), {
        headers: authHeader,
      })
      .then((r) => {
        setAgreements((prev) => ({
          ...prev,
          [bookingId]: r.data.data,
        }));
      })
      .catch((err) => {
        if (attempt === 0 && err.response?.status === 404) {
          // Agreement generation may be slightly delayed — retry after 2s
          setTimeout(() => fetchAgreementForBooking(bookingId, 1), 2000);
        } else {
          // After retry still failed → mark as null so UI shows retry button
          setAgreements((prev) => ({
            ...prev,
            [bookingId]: null,
          }));
        }
      });
  };

  // ── Manually retry fetching a single agreement ────────────────────────────
  const retryFetchAgreement = (bookingId) => {
    // Remove null sentinel so UI reverts to "Loading..." while retrying
    setAgreements((prev) => {
      const next = { ...prev };
      delete next[bookingId];
      return next;
    });
    fetchAgreementForBooking(bookingId, 0);
  };

  const handleStatusUpdate = (bookingId, status) => {
    const actionText = status === "approved" ? "approve" : "reject";

    showConfirm(
      `Are you sure you want to ${actionText} this booking? This action is final.`,
      async () => {
        showLoader();
        try {
          const route =
            status === "approved"
              ? API_ROUTES.BOOKING.APPROVE(bookingId)
              : API_ROUTES.BOOKING.REJECT(bookingId);

          await axios.put(route, {}, { headers: authHeader });

          setBookings((prev) =>
            prev.map((b) => (b._id === bookingId ? { ...b, status } : b)),
          );

          showAlert(`Booking ${status} successfully!`, "success");

          // If just approved, start fetching the agreement (with retry logic)
          if (status === "approved") {
            // Remove any stale entry so the UI shows "Loading agreement..."
            setAgreements((prev) => {
              const next = { ...prev };
              delete next[bookingId];
              return next;
            });
            fetchAgreementForBooking(bookingId, 0);
          }
        } catch (err) {
          console.error(err?.response?.data);
          showAlert(`Failed to ${actionText} booking.`, "error");
        } finally {
          hideLoader();
        }
      },
    );
  };

  // ── Render agreement button based on agreement state ──────────────────────
  const renderAgreementCTA = (booking) => {
    if (booking.status !== "approved") return null;

    // Key absent → fetch not yet attempted or still in-flight
    if (!(booking._id in agreements)) {
      return (
        <span className="text-xs text-gray-400 italic">
          Loading agreement...
        </span>
      );
    }

    // Key present but null → fetch failed after retry
    if (agreements[booking._id] === null) {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            retryFetchAgreement(booking._id);
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-red-500 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-100 transition active:scale-95"
        >
          <FaRedoAlt size={10} />
          Agreement not ready — retry
        </button>
      );
    }

    const agreement = agreements[booking._id];

    if (agreement.status === "pending_tenant") {
      return (
        <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg">
          <FaHourglassHalf size={11} />
          Awaiting tenant signature
        </span>
      );
    }

    if (agreement.status === "pending_owner") {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveAgreement(agreement);
          }}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-xl
            font-bold text-sm hover:bg-primary-dark transition shadow-sm active:scale-95"
        >
          <FaFileContract size={13} />
          Countersign Agreement
        </button>
      );
    }

    if (agreement.status === "completed") {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setActiveAgreement(agreement);
          }}
          className="flex items-center gap-2 border border-green-200 text-green-600 px-4 py-2.5
            rounded-xl font-bold text-sm hover:bg-green-50 transition"
        >
          <FaCheckCircle size={13} />
          View Agreement
        </button>
      );
    }

    return null;
  };

  if (loading) return null;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-secondary rounded-[2rem] p-8 text-center relative mb-10 shadow-lg">
          <button
            onClick={() => navigate(-1)}
            className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-black text-white uppercase tracking-tight">
            Manage Bookings
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Review and verify booking requests for your property
          </p>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-medium text-lg">
              No bookings found for this property.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                onClick={() => setSelectedUser(booking.user)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer group"
              >
                {/* ── Left: tenant info ── */}
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary transition-colors">
                    <FaUser
                      className="text-primary group-hover:text-secondary"
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-secondary text-lg">
                      {booking.user?.name || "Unknown User"}
                    </h3>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                      <p className="flex items-center gap-1">
                        <FaCalendarAlt className="text-primary" size={12} />
                        {new Date(
                          booking.checkInDate || booking.date,
                        ).toLocaleDateString()}
                      </p>
                      <p className="flex items-center gap-1 font-bold text-secondary">
                        <FaMoneyBillWave className="text-green-500" size={12} />
                        Rs. {booking.totalAmount?.toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-3 inline-block shadow-sm
                        ${
                          booking.status === "pending" ||
                          booking.status === "held"
                            ? "bg-yellow-100 text-yellow-700"
                            : booking.status === "approved" ||
                                booking.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                        }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                </div>

                {/* ── Right: action buttons ── */}
                <div
                  className="flex flex-wrap items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Approve / Reject — only for pending or held */}
                  {(booking.status === "pending" ||
                    booking.status === "held") && (
                    <>
                      <button
                        onClick={() =>
                          handleStatusUpdate(booking._id, "approved")
                        }
                        className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-600 transition shadow-sm active:scale-95"
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        onClick={() =>
                          handleStatusUpdate(booking._id, "rejected")
                        }
                        className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition shadow-sm active:scale-95"
                      >
                        <FaTimes /> Reject
                      </button>
                    </>
                  )}

                  {/* Agreement CTA — only for approved bookings */}
                  {renderAgreementCTA(booking)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Tenant Verification Modal ── */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-300">
            <div className="bg-secondary p-8 text-center text-white relative">
              <button
                onClick={() => setSelectedUser(null)}
                className="absolute top-6 right-6 text-white/50 hover:text-white transition"
              >
                <FaTimes size={24} />
              </button>
              <div className="w-24 h-24 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/10 shadow-lg">
                <FaUser size={40} className="text-secondary" />
              </div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                {selectedUser.name}
              </h2>
              <div className="flex justify-center gap-3 mt-2">
                <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/20">
                  {selectedUser.userType || "Tenant"}
                </span>
                {selectedUser.approvedByAdmin && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/30 flex items-center gap-1">
                    <FaShieldAlt size={10} /> Verified Identity
                  </span>
                )}
              </div>
            </div>

            <div className="p-8 md:p-12 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
                    <FaEnvelope />
                  </div>
                  <div className="truncate">
                    <p className="text-[10px] uppercase font-black text-gray-400">
                      Email Address
                    </p>
                    <p className="text-secondary font-bold truncate">
                      {selectedUser.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
                    <FaPhone />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400">
                      Phone Number
                    </p>
                    <p className="text-secondary font-bold">
                      {selectedUser.number || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
                    <FaVenusMars />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400">
                      Gender
                    </p>
                    <p className="text-secondary font-bold capitalize">
                      {selectedUser.gender || "Not Specified"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-primary">
                    <FaCalendarAlt />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-black text-gray-400">
                      User Since
                    </p>
                    <p className="text-secondary font-bold">
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString()
                        : "New User"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <FaIdCard className="text-primary" />
                  <h3 className="font-black text-secondary uppercase tracking-tight">
                    Identity Documents (CNIC)
                  </h3>
                </div>

                {selectedUser.cnicPhotos &&
                selectedUser.cnicPhotos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {selectedUser.cnicPhotos.map((photo, index) => (
                      <div key={index} className="space-y-2">
                        <div className="aspect-video bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 shadow-inner group">
                          <img
                            src={`${IMAGE_BASE_URL}/${photo.split(/[\\/]/).pop()}`}
                            alt={`CNIC ${index === 0 ? "Front" : "Back"}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {index === 0 ? "CNIC Front" : "CNIC Back"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center">
                    <div className="flex justify-center text-gray-300 mb-2">
                      <FaInfoCircle size={30} />
                    </div>
                    <p className="text-gray-400 text-sm italic">
                      User has not uploaded identity documents.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="w-full py-4 bg-secondary text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-secondary/20 transform active:scale-95"
              >
                Close Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Agreement Modal (owner countersign) ── */}
      {activeAgreement && (
        <AgreementModal
          agreement={activeAgreement}
          mode="owner"
          onClose={() => setActiveAgreement(null)}
          onSigned={(updated) => {
            setAgreements((prev) => ({
              ...prev,
              [updated.booking]: updated,
            }));
            setActiveAgreement(updated);
          }}
        />
      )}
    </div>
  );
};

export default PropertyBookings;
