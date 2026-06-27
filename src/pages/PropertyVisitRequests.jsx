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
  FaClock,
  FaShieldAlt,
  FaVenusMars,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { useLoader } from "../context/LoaderContext";
import { API_ROUTES, IMAGE_BASE_URL } from "../api/apiRoutes"; // Import IMAGE_BASE_URL for CNIC display

const PropertyVisitRequests = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showAlert, showConfirm } = useAlert();
  const { showLoader, hideLoader } = useLoader();

  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchRequests = async () => {
    try {
      const res = await axios.get(`${API_ROUTES.VISITS.GET_BY_PROPERTY(id)}`, {
        headers: {
          authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      setRequests(res.data.data || []);
    } catch (err) {
      console.error(err);
      showAlert("Failed to load visit requests", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (visitId, status) => {
    const actionText = status === "approved" ? "approve" : "reject";

    showConfirm(
      `Are you sure you want to ${actionText} this visit request?`,
      async () => {
        showLoader();
        try {
          await axios.patch(
            `${API_ROUTES.VISITS.UPDATE_STATUS(visitId)}`,
            { status },
            {
              headers: {
                authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            },
          );

          setRequests((prev) =>
            prev.map((r) => (r._id === visitId ? { ...r, status } : r)),
          );

          showAlert(`Visit request ${status} successfully.`, "success");
        } catch (err) {
          console.error(err);
          showAlert("Failed to update request status.", "error");
        } finally {
          hideLoader();
        }
      },
    );
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
            Property Visit Requests
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Click a card to verify the visitor's identity
          </p>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white p-12 rounded-[2.5rem] text-center border border-gray-100 shadow-sm">
            <p className="text-gray-400 font-medium">
              No visit requests for this property yet.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((req) => (
              <div
                key={req._id}
                onClick={() => setSelectedUser(req.userId)}
                className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:shadow-md cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-4 rounded-2xl group-hover:bg-primary transition-colors">
                    <FaUser
                      className="text-primary group-hover:text-secondary"
                      size={20}
                    />
                  </div>

                  <div>
                    <h3 className="font-bold text-secondary text-lg">
                      {req.userId?.name || "Anonymous User"}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-2">
                      <FaCalendarAlt size={12} className="text-primary" />{" "}
                      {new Date(req.date).toDateString()}
                      <span className="text-gray-300">|</span>
                      <FaClock size={12} className="text-primary" />{" "}
                      {req.startTime} - {req.endTime}
                    </p>

                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-2 inline-block shadow-sm 
                      ${
                        req.status === "pending"
                          ? "bg-yellow-100 text-yellow-700"
                          : req.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {req.status}
                    </span>
                  </div>
                </div>

                {req.status === "pending" && (
                  <div
                    className="flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => handleStatusUpdate(req._id, "approved")}
                      className="flex items-center gap-2 bg-green-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-green-600 transition shadow-sm active:scale-95"
                    >
                      <FaCheck /> Approve
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(req._id, "rejected")}
                      className="flex items-center gap-2 bg-red-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-600 transition shadow-sm active:scale-95"
                    >
                      <FaTimes /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* USER VERIFICATION MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
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
                  {selectedUser.userType || "Visitor"}
                </span>
                {selectedUser.approvedByAdmin && (
                  <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-green-500/30 flex items-center gap-1">
                    <FaShieldAlt size={10} /> Verified by Admin
                  </span>
                )}
              </div>
            </div>

            <div className="p-8 md:p-12 space-y-8">
              {/* Contact & Personal Grid */}
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
                      {selectedUser.number || "Not Provided"}
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
                      Member Since
                    </p>
                    <p className="text-secondary font-bold">
                      {selectedUser.createdAt
                        ? new Date(selectedUser.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>

              {/* CNIC Verification Section */}
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
                            alt={`CNIC Side ${index + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                        </div>
                        <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {index === 0 ? "Front Side" : "Back Side"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-200 rounded-3xl text-center">
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
                Finished Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyVisitRequests;
