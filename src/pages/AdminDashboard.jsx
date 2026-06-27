import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FaHome,
  FaUsers,
  FaClipboardList,
  FaMoneyBillWave,
  FaCalendarCheck,
  FaEye,
  FaTools,
  FaFileContract,
  FaSearch,
  FaBan,
  FaCheck,
  FaTrash,
  FaFilter,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { API_ROUTES } from "../api/apiRoutes";

const StatCard = ({ icon: Icon, label, value, sub, accent }) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${accent}">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center ${accent}`}
      >
        <Icon size={18} className="text-white" />
      </div>
    </div>
    <p className="text-2xl font-extrabold text-gray-900">{value ?? "—"}</p>
    <p className="text-sm font-medium text-gray-500 mt-0.5">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const Section = ({ title, icon: Icon, action, children }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={15} className="text-primary" />}
        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
      </div>
      {action}
    </div>
    {children}
  </div>
);

const Badge = ({ status }) => {
  const map = {
    active: "bg-green-50 text-green-700",
    inactive: "bg-gray-100 text-gray-500",
    occupied: "bg-blue-50 text-blue-700",
    pending: "bg-yellow-50 text-yellow-700",
    approved: "bg-green-50 text-green-700",
    confirmed: "bg-emerald-50 text-emerald-700",
    rejected: "bg-red-50 text-red-600",
    cancelled: "bg-gray-100 text-gray-500",
    success: "bg-green-50 text-green-700",
    failed: "bg-red-50 text-red-600",
    open: "bg-orange-50 text-orange-600",
    resolved: "bg-green-50 text-green-700",
    in_progress: "bg-blue-50 text-blue-700",
    banned: "bg-red-100 text-red-700",
    unpaid: "bg-gray-100 text-gray-500",
    paid: "bg-green-50 text-green-700",
  };
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${map[status] || "bg-gray-100 text-gray-500"}`}
    >
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [propFilter, setPropFilter] = useState("all");
  const [bookingFilter, setBookingFilter] = useState("all");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    try {
      const [propsRes, usersRes, bookingsRes, mainRes] = await Promise.all([
        fetch(API_ROUTES.ACCOMMODATIONS.ALL, { headers }),
        fetch(`http://localhost:4000/api/auth/admin/users`, { headers }).catch(
          () => null,
        ),
        fetch(`http://localhost:4000/api/bookings/admin/all`, {
          headers,
        }).catch(() => null),
        fetch(API_ROUTES.MAINTENANCE.OWNER_REQUESTS, { headers }).catch(
          () => null,
        ),
      ]);

      let props = [];
      if (propsRes.ok) {
        const d = await propsRes.json();
        props = Array.isArray(d) ? d : d.properties || d.data || [];
      }

      let usrs = [];
      if (usersRes?.ok) {
        const d = await usersRes.json();
        usrs = Array.isArray(d) ? d : d.users || d.data || [];
      }

      let bkgs = [];
      if (bookingsRes?.ok) {
        const d = await bookingsRes.json();
        bkgs = Array.isArray(d) ? d : d.bookings || d.data || [];
      }

      let maint = [];
      if (mainRes?.ok) {
        const d = await mainRes.json();
        maint = Array.isArray(d) ? d : d.requests || d.data || [];
      }

      setProperties(props);
      setUsers(usrs);
      setBookings(bkgs);
      setMaintenance(maint);

      setStats({
        totalUsers: usrs.length,
        totalProperties: props.length,
        activeProperties: props.filter((p) => p.status === "active").length,
        totalBookings: bkgs.length,
        confirmedBookings: bkgs.filter((b) => b.status === "confirmed").length,
        pendingBookings: bkgs.filter((b) => b.status === "pending").length,
        openMaintenance: maint.filter(
          (m) => m.status === "open" || m.status === "in_progress",
        ).length,
        totalMaintenance: maint.length,
        revenue: bkgs
          .filter((b) => b.paymentStatus === "paid")
          .reduce((s, b) => s + (b.totalAmount || 0), 0),
      });
    } catch (err) {
      console.error("Admin fetch error:", err);
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const deleteProperty = async (id) => {
    if (!window.confirm("Delete this property? This cannot be undone.")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(API_ROUTES.ACCOMMODATIONS.DELETE(id), {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProperties((p) => p.filter((x) => x._id !== id));
      setStats((s) => ({ ...s, totalProperties: s.totalProperties - 1 }));
    }
  };

  const toggleUserBan = async (userId, isBanned) => {
    const token = localStorage.getItem("token");
    const res = await fetch(
      `http://localhost:4000/api/auth/admin/users/${userId}/${isBanned ? "unban" : "ban"}`,
      { method: "PATCH", headers: { Authorization: `Bearer ${token}` } },
    );
    if (res.ok) {
      setUsers((u) =>
        u.map((x) => (x._id === userId ? { ...x, banned: !isBanned } : x)),
      );
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase()),
  );
  const filteredProps =
    propFilter === "all"
      ? properties
      : properties.filter((p) => p.status === propFilter);
  const filteredBookings =
    bookingFilter === "all"
      ? bookings
      : bookings.filter((b) => b.status === bookingFilter);

  const tabs = [
    { id: "overview", label: "Overview", icon: FaHome },
    { id: "users", label: `Users (${users.length})`, icon: FaUsers },
    {
      id: "properties",
      label: `Properties (${properties.length})`,
      icon: FaClipboardList,
    },
    {
      id: "bookings",
      label: `Bookings (${bookings.length})`,
      icon: FaCalendarCheck,
    },
    {
      id: "maintenance",
      label: `Maintenance (${maintenance.length})`,
      icon: FaTools,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            Loading dashboard…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl p-8 shadow-sm border border-red-100 max-w-sm">
          <p className="text-red-500 font-semibold mb-2">
            Something went wrong
          </p>
          <p className="text-xs text-gray-400 mb-4">{error}</p>
          <button
            onClick={fetchAll}
            className="px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-dark transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              Logged in as{" "}
              <span className="font-semibold text-primary">{user?.email}</span>
            </p>
          </div>
          <Link
            to="/homepage"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <FaHome size={13} /> Back to Site
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm mb-6 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                activeTab === id
                  ? "bg-primary text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={FaUsers}
                label="Total Users"
                value={stats?.totalUsers}
                accent="bg-violet-500"
              />
              <StatCard
                icon={FaHome}
                label="Properties"
                value={stats?.totalProperties}
                sub={`${stats?.activeProperties} active`}
                accent="bg-primary"
              />
              <StatCard
                icon={FaCalendarCheck}
                label="Bookings"
                value={stats?.totalBookings}
                sub={`${stats?.pendingBookings} pending`}
                accent="bg-blue-500"
              />
              <StatCard
                icon={FaMoneyBillWave}
                label="Revenue (PKR)"
                value={
                  stats?.revenue ? `₨${stats.revenue.toLocaleString()}` : "₨0"
                }
                sub={`${stats?.confirmedBookings} confirmed`}
                accent="bg-emerald-500"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <StatCard
                icon={FaTools}
                label="Open Maintenance"
                value={stats?.openMaintenance}
                sub={`${stats?.totalMaintenance} total`}
                accent="bg-orange-500"
              />
              <StatCard
                icon={FaFileContract}
                label="Confirmed Bookings"
                value={stats?.confirmedBookings}
                accent="bg-teal-500"
              />
            </div>
            <Section title="Recent Properties" icon={FaHome}>
              {properties.length === 0 ? (
                <p className="px-5 py-6 text-xs text-gray-400 text-center">
                  No properties yet
                </p>
              ) : (
                <div className="divide-y divide-gray-50">
                  {properties.slice(0, 5).map((p) => (
                    <div
                      key={p._id}
                      className="flex items-center justify-between px-5 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-gray-800 truncate max-w-[220px]">
                          {p.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          {p.city} · ₨{p.rent?.toLocaleString()}/mo
                        </p>
                      </div>
                      <Badge status={p.status} />
                    </div>
                  ))}
                </div>
              )}
            </Section>
          </div>
        )}

        {/* USERS */}
        {activeTab === "users" && (
          <Section
            title={`Users (${filteredUsers.length})`}
            icon={FaUsers}
            action={
              <div className="relative">
                <FaSearch
                  size={11}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            }
          >
            {users.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-gray-500">
                  No user data available
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Add{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    GET /api/auth/admin/users
                  </code>{" "}
                  to your backend
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {[
                        "Name",
                        "Email",
                        "Role",
                        "Joined",
                        "Status",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {u.name?.[0]?.toUpperCase() || "?"}
                            </div>
                            <span className="font-medium text-gray-800 truncate max-w-[120px]">
                              {u.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {u.email}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${u.role === "admin" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-600"}`}
                          >
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString(
                                "en-PK",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge status={u.banned ? "banned" : "active"} />
                        </td>
                        <td className="px-5 py-3">
                          {u._id !== user?._id && (
                            <button
                              onClick={() => toggleUserBan(u._id, u.banned)}
                              className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${u.banned ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-red-50 text-red-500 hover:bg-red-100"}`}
                            >
                              {u.banned ? (
                                <FaCheck size={10} />
                              ) : (
                                <FaBan size={10} />
                              )}
                              {u.banned ? "Unban" : "Ban"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}

        {/* PROPERTIES */}
        {activeTab === "properties" && (
          <Section
            title={`Properties (${filteredProps.length})`}
            icon={FaClipboardList}
            action={
              <div className="flex items-center gap-1.5">
                <FaFilter size={11} className="text-gray-400" />
                <select
                  value={propFilter}
                  onChange={(e) => setPropFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="occupied">Occupied</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    {[
                      "Title",
                      "City",
                      "Type",
                      "Rent",
                      "Views",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredProps.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-8 text-center text-gray-400 text-xs"
                      >
                        No properties found
                      </td>
                    </tr>
                  ) : (
                    filteredProps.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-800 truncate max-w-[180px]">
                            {p.title}
                          </p>
                          <p className="text-[10px] text-gray-400 capitalize">
                            {p.propertyType} · {p.postType}
                          </p>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {p.city}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs capitalize">
                          {p.propertyType}
                        </td>
                        <td className="px-5 py-3 text-gray-800 text-xs font-semibold">
                          ₨{p.rent?.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          <span className="flex items-center gap-1">
                            <FaEye size={10} /> {p.views ?? 0}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <Badge status={p.status} />
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <Link
                              to={`/property/${p._id}`}
                              className="text-xs text-primary hover:underline font-medium"
                            >
                              View
                            </Link>
                            <button
                              onClick={() => deleteProperty(p._id)}
                              className="text-red-400 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <FaTrash size={11} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Section>
        )}

        {/* BOOKINGS */}
        {activeTab === "bookings" && (
          <Section
            title={`Bookings (${filteredBookings.length})`}
            icon={FaCalendarCheck}
            action={
              <div className="flex items-center gap-1.5">
                <FaFilter size={11} className="text-gray-400" />
                <select
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            }
          >
            {bookings.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-semibold text-gray-500">
                  No booking data available
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Add{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    GET /api/bookings/admin/all
                  </code>{" "}
                  to your backend
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {[
                        "ID",
                        "Property",
                        "Tenant",
                        "Dates",
                        "Amount",
                        "Status",
                        "Payment",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredBookings.map((b) => (
                      <tr
                        key={b._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-gray-400 text-[10px] font-mono">
                          {b._id?.slice(-6).toUpperCase()}
                        </td>
                        <td className="px-5 py-3 text-gray-700 text-xs font-medium truncate max-w-[150px]">
                          {b.property?.title || "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {b.user?.name || "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-[10px]">
                          {b.checkInDate
                            ? new Date(b.checkInDate).toLocaleDateString(
                                "en-PK",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                          {" → "}
                          {b.checkOutDate
                            ? new Date(b.checkOutDate).toLocaleDateString(
                                "en-PK",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                        </td>
                        <td className="px-5 py-3 text-gray-800 text-xs font-semibold">
                          {b.totalAmount
                            ? `₨${b.totalAmount.toLocaleString()}`
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge status={b.status} />
                        </td>
                        <td className="px-5 py-3">
                          <Badge status={b.paymentStatus} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}

        {/* MAINTENANCE */}
        {activeTab === "maintenance" && (
          <Section
            title={`Maintenance Requests (${maintenance.length})`}
            icon={FaTools}
          >
            {maintenance.length === 0 ? (
              <p className="px-5 py-10 text-center text-xs text-gray-400">
                No maintenance requests found
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left">
                      {[
                        "Ref",
                        "Title",
                        "Category",
                        "Priority",
                        "Reported by",
                        "Status",
                        "Date",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {maintenance.map((m) => (
                      <tr
                        key={m._id}
                        className="hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="px-5 py-3 text-gray-400 text-[10px] font-mono font-bold">
                          {m.requestNumber}
                        </td>
                        <td className="px-5 py-3 text-gray-800 font-medium text-xs truncate max-w-[180px]">
                          {m.title}
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs capitalize">
                          {m.category}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                              m.priority === "emergency"
                                ? "bg-red-100 text-red-700"
                                : m.priority === "high"
                                  ? "bg-orange-100 text-orange-700"
                                  : m.priority === "medium"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                          >
                            {m.priority}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 text-xs">
                          {m.reportedBy?.name || "—"}
                        </td>
                        <td className="px-5 py-3">
                          <Badge status={m.status} />
                        </td>
                        <td className="px-5 py-3 text-gray-400 text-xs">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleDateString(
                                "en-PK",
                                { day: "numeric", month: "short" },
                              )
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Section>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
