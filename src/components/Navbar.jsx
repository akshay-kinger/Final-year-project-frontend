import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaBars,
  FaTimes,
  FaUserCircle,
  FaCalendarCheck,
  FaHome,
  FaPlus,
  FaSignOutAlt,
  FaUser,
  FaClipboardList,
  FaEye,
  FaChevronDown,
  FaBookmark,
  FaShieldAlt,
} from "react-icons/fa";
import { useAlert } from "../context/AlertContext";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { showAlert } = useAlert();
  const { user, logout } = useAuth();
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === "admin";

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    showAlert("Logged out successfully", "success");
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `relative px-1 py-1 text-[0.92rem] font-medium transition-colors duration-200 group
    ${isActive(path) ? "text-primary" : "text-gray-600 hover:text-gray-900"}`;

  const underline = (path) =>
    `absolute -bottom-0.5 left-0 h-[2px] bg-primary rounded-full transition-all duration-200 ${
      isActive(path) ? "w-full" : "w-0 group-hover:w-full"
    }`;

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="w-[95%] 2xl:max-w-[1400px] mx-auto">
          <div className="flex items-center justify-between h-[68px]">
            {/* ── Logo ─────────────────────────────────────────────────── */}
            <Link
              to={user ? "/homepage" : "/"}
              className="flex items-center gap-2 shrink-0"
            >
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-sm">
                <FaHome className="text-white text-sm" />
              </div>
              <span className="text-[1.35rem] font-extrabold text-gray-900 tracking-tight">
                Vacant<span className="text-primary">Place</span>
              </span>
            </Link>

            {/* ── Desktop Nav Links ─────────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                to={user ? "/homepage" : "/"}
                className={navLinkClass("/homepage")}
              >
                Home
                <span className={underline("/homepage")} />
              </Link>

              {!user ? (
                <Link to="/about" className={navLinkClass("/about")}>
                  About
                  <span className={underline("/about")} />
                </Link>
              ) : (
                <>
                  <Link to="/my-visits" className={navLinkClass("/my-visits")}>
                    My Visits
                    <span className={underline("/my-visits")} />
                  </Link>

                  <Link
                    to="/my-bookings"
                    className={navLinkClass("/my-bookings")}
                  >
                    My Bookings
                    <span className={underline("/my-bookings")} />
                  </Link>

                  <Link
                    to="/my-shortlist"
                    className={navLinkClass("/my-shortlist")}
                  >
                    My Shortlist
                    <span className={underline("/my-shortlist")} />
                  </Link>
                </>
              )}
            </div>

            {/* ── Desktop Right Section ─────────────────────────────────── */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  {/* List a Place CTA */}
                  <Link
                    to="/add-property"
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-primary-dark transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                  >
                    <FaPlus size={11} />
                    List a Place
                  </Link>

                  {/* Profile Dropdown */}
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsProfileOpen(!isProfileOpen)}
                      className={`flex items-center gap-2 pl-3 pr-2.5 py-1.5 rounded-lg border transition-all duration-200 text-sm font-medium
                        ${
                          isProfileOpen
                            ? "bg-gray-50 border-gray-300 text-gray-900"
                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        }`}
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <FaUser size={10} className="text-primary" />
                      </div>
                      <span className="max-w-[90px] truncate">
                        {user?.name?.split(" ")[0] || "Account"}
                      </span>
                      <FaChevronDown
                        size={10}
                        className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`}
                      />
                    </button>

                    {/* Dropdown Panel */}
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 overflow-hidden">
                        {/* User info header */}
                        <div className="px-4 py-2.5 border-b border-gray-50 mb-1">
                          <p className="text-xs font-bold text-gray-900 truncate">
                            {user?.name || "User"}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate mt-0.5">
                            {user?.email || ""}
                          </p>
                        </div>

                        <Link
                          to="/profile"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <FaUser size={12} className="text-gray-400" />
                          Your Profile
                        </Link>

                        <Link
                          to="/my-properties"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <FaClipboardList
                            size={12}
                            className="text-gray-400"
                          />
                          My Posts
                        </Link>

                        <Link
                          to="/my-bookings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <FaCalendarCheck
                            size={12}
                            className="text-gray-400"
                          />
                          My Bookings
                        </Link>

                        <Link
                          to="/my-visits"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <FaEye size={12} className="text-gray-400" />
                          My Visits
                        </Link>

                        <Link
                          to="/my-shortlist"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                        >
                          <FaBookmark size={12} className="text-gray-400" />
                          My Shortlist
                        </Link>

                        {/* ── Admin link — only visible when role === "admin" ── */}
                        {isAdmin && (
                          <>
                            <div className="mx-4 my-1 border-t border-gray-100" />
                            <Link
                              to="/admin/dashboard"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-violet-600 hover:bg-violet-50 hover:text-violet-700 transition-colors font-medium"
                            >
                              <FaShieldAlt
                                size={12}
                                className="text-violet-500"
                              />
                              Admin Dashboard
                            </Link>
                          </>
                        )}

                        <div className="mx-4 my-1 border-t border-gray-100" />

                        <button
                          onClick={handleLogout}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <FaSignOutAlt size={12} />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/signup"
                    className="px-5 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-black transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* ── Mobile Hamburger ─────────────────────────────────────── */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ─────────────────────────────────────────────────── */}
      <div
        className={`md:hidden fixed inset-x-0 top-[68px] z-40 bg-white border-b border-gray-100 shadow-lg transition-all duration-300 ease-in-out ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-3 pointer-events-none"
        }`}
      >
        <div className="px-4 py-4 space-y-1">
          <Link
            to={user ? "/homepage" : "/"}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
              isActive("/homepage")
                ? "bg-primary/10 text-primary"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            <FaHome
              size={14}
              className={
                isActive("/homepage") ? "text-primary" : "text-gray-400"
              }
            />
            Home
          </Link>

          {!user ? (
            <Link
              to="/about"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive("/about")
                  ? "bg-primary/10 text-primary"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              About
            </Link>
          ) : (
            <>
              <Link
                to="/my-visits"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/my-visits")
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaEye
                  size={14}
                  className={
                    isActive("/my-visits") ? "text-primary" : "text-gray-400"
                  }
                />
                My Visits
              </Link>

              <Link
                to="/my-bookings"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/my-bookings")
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaCalendarCheck
                  size={14}
                  className={
                    isActive("/my-bookings") ? "text-primary" : "text-gray-400"
                  }
                />
                My Bookings
              </Link>

              <Link
                to="/my-shortlist"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/my-shortlist")
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaBookmark
                  size={14}
                  className={
                    isActive("/my-shortlist") ? "text-primary" : "text-gray-400"
                  }
                />
                My Shortlist
              </Link>

              <Link
                to="/my-properties"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/my-properties")
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaClipboardList
                  size={14}
                  className={
                    isActive("/my-properties")
                      ? "text-primary"
                      : "text-gray-400"
                  }
                />
                My Posts
              </Link>

              <Link
                to="/profile"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive("/profile")
                    ? "bg-primary/10 text-primary"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaUser
                  size={14}
                  className={
                    isActive("/profile") ? "text-primary" : "text-gray-400"
                  }
                />
                Profile
              </Link>

              {/* Admin dashboard — mobile, only for admins */}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive("/admin/dashboard")
                      ? "bg-violet-100 text-violet-700"
                      : "text-violet-600 hover:bg-violet-50"
                  }`}
                >
                  <FaShieldAlt
                    size={14}
                    className={
                      isActive("/admin/dashboard")
                        ? "text-violet-700"
                        : "text-violet-400"
                    }
                  />
                  Admin Dashboard
                </Link>
              )}

              <div className="pt-2 pb-1">
                <Link
                  to="/add-property"
                  className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-colors active:scale-95"
                >
                  <FaPlus size={12} />
                  List a Place
                </Link>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
                >
                  <FaSignOutAlt size={14} />
                  Sign out
                </button>
              </div>
            </>
          )}

          {!user && (
            <div className="pt-2 grid grid-cols-2 gap-3">
              <Link
                to="/login"
                className="flex items-center justify-center px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className="flex items-center justify-center px-4 py-3 text-sm font-bold text-white bg-gray-900 hover:bg-black rounded-xl transition-colors"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 top-[68px] bg-black/20 z-30"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
