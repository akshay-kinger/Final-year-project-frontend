import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import MyMaintenanceRequests from "./pages/MyMaintenanceRequests";

// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import PropertyDetails from "./pages/PropertyDetails";
import AddProperty from "./pages/AddProperty";
import UserProfile from "./pages/UserProfile";
import Homepage from "./pages/Homepage";
import MyProperties from "./pages/MyProperties";
import UpdateProperty from "./pages/UpdateProperty";
import Chat from "./pages/chat";
import VerifySignupOtp from "./pages/VerifySignupOtp";
import PropertyBookings from "./pages/PropertyBookings";
import MyShortlist from "./pages/MyShortlist";
import OwnerProfile from "./pages/OwnerProfile";
import OwnerMaintenanceRequests from "./pages/ownerMaintenanceDashboard";
import AdminDashboard from "./pages/AdminDashboard";

// Visit system pages
import RequestVisit from "./pages/RequestVisit";
import PropertyVisitRequests from "./pages/PropertyVisitRequests";
import MyVisits from "./pages/MyVisits";

// Booking & Payment
import Booking from "./pages/Booking";
import Payment from "./pages/Payment";
import UpdateBooking from "./pages/updateBooking";
import MyBookings from "./pages/MyBookings";
import BookingCard from "./pages/BookingCard";

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-light">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            {/* ── PUBLIC ROUTES ──────────────────────────────────────── */}
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/verify-signup-otp" element={<VerifySignupOtp />} />

            {/* ── PROTECTED ROUTES ───────────────────────────────────── */}
            <Route
              path="/homepage"
              element={
                <ProtectedRoute>
                  <Homepage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/:ownerId"
              element={
                <ProtectedRoute>
                  <OwnerProfile />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Property */}
            <Route
              path="/property/:id"
              element={
                <ProtectedRoute>
                  <PropertyDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-property"
              element={
                <ProtectedRoute>
                  <AddProperty />
                </ProtectedRoute>
              }
            />
            <Route
              path="/maintenance/my-requests"
              element={
                <ProtectedRoute>
                  <MyMaintenanceRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-properties"
              element={
                <ProtectedRoute>
                  <MyProperties />
                </ProtectedRoute>
              }
            />
            <Route
              path="/update-property/:id"
              element={
                <ProtectedRoute>
                  <UpdateProperty />
                </ProtectedRoute>
              }
            />

            {/* Booking flow — tenant */}
            <Route
              path="/booking/:propertyId"
              element={
                <ProtectedRoute>
                  <Booking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/update-booking/:bookingId"
              element={
                <ProtectedRoute>
                  <UpdateBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/booking-card/:bookingId"
              element={
                <ProtectedRoute>
                  <BookingCard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payment/:bookingId"
              element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              }
            />

            {/* Booking management — owner */}
            <Route
              path="/property/:propertyId/bookings"
              element={
                <ProtectedRoute>
                  <PropertyBookings />
                </ProtectedRoute>
              }
            />

            {/* Visit flow — tenant */}
            <Route
              path="/property/:id/request-visit"
              element={
                <ProtectedRoute>
                  <RequestVisit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-visits"
              element={
                <ProtectedRoute>
                  <MyVisits />
                </ProtectedRoute>
              }
            />

            {/* Visit management — owner */}
            <Route
              path="/property/:id/requests"
              element={
                <ProtectedRoute>
                  <PropertyVisitRequests />
                </ProtectedRoute>
              }
            />

            <Route
              path="/owner/maintenance"
              element={
                <ProtectedRoute>
                  <OwnerMaintenanceRequests />
                </ProtectedRoute>
              }
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              }
            />

            {/* Shortlist */}
            <Route
              path="/my-shortlist"
              element={
                <ProtectedRoute>
                  <MyShortlist />
                </ProtectedRoute>
              }
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
