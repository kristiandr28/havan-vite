
import React from "react";
import { Routes, Route } from 'react-router-dom';
import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Activities from '../pages/Activities';
import Tours from '../pages/Tours';
import Tickets from '../pages/Tickets';
import Destinations from '../pages/Destinations';
import SpeakingGuides from '../pages/SpeakingGuides';
import PhotoGallery from '../pages/PhotoGallery';
import CheckoutPage from '../pages/CheckoutPage'; // Import your new CheckoutPage component
import VerifyEmail from '../pages/VerifyEmail';
import VerifySuccess from "../pages/verify/VerifySuccess";
import VerifyFailed from "../pages/verify/VerifyFailed";
import AlreadyVerified from "../pages/verify/AlreadyVerified";
import VerifyError from "../pages/verify/VerifyError";
// --- NEW IMPORTS ---
import ForgotPasswordPage from "../pages/ForgetPassword/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ForgetPassword/ResetPasswordPage";
import PaymentSuccess from '../components/PaymentSuccess'; // Import PaymentSuccess component
import PaymentFailed from '../components/PaymentFailed';   // Import PaymentFailed component
import SwiftCodePage from '../pages/SwiftCodePage'; // NEW: Import SwiftCodePage component
// --- END NEW IMPORTS ---


const PublicRoutes = ({ openDetailModal, activeCurrency, BACKEND_URL, isAuthenticated, handleCheckoutSubmit, cartItems, itemDetails, setItemDetails, token, currentUser, clearCart }) => (
    <Routes>
        <Route
            path="/"
            element={
                <Home
                    openDetailModal={openDetailModal}
                    activeCurrency={activeCurrency}
                    BACKEND_URL={BACKEND_URL}
                />
            }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
            path="/activities"
            element={
                <Activities
                    openDetailModal={openDetailModal}
                    activeCurrency={activeCurrency}
                    BACKEND_URL={BACKEND_URL}
                />
            }
        />
        <Route
            path="/tours"
            element={
                <Tours
                    openDetailModal={openDetailModal}
                    activeCurrency={activeCurrency}
                    BACKEND_URL={BACKEND_URL}
                />
            }
        />
        <Route
            path="/tickets"
            element={
                <Tickets
                    openDetailModal={openDetailModal}
                    activeCurrency={activeCurrency}
                    BACKEND_URL={BACKEND_URL}
                />
            }
        />
        <Route
            path="/destinations"
            element={
                <Destinations
                    openDetailModal={openDetailModal}
                    activeCurrency={activeCurrency}
                    BACKEND_URL={BACKEND_URL}
                />
            }
        />
        <Route
            path="/speaking-guides"
            element={
                <SpeakingGuides
                    openDetailModal={openDetailModal}
                    activeCurrency={activeCurrency}
                    BACKEND_URL={BACKEND_URL}
                />
            }
        />
        <Route
            path="/gallery"
            element={<PhotoGallery BACKEND_URL={BACKEND_URL} />}
        />
        <Route path="/auth/callback" element={<Home />} />

        {/* --- Route for Checkout Page --- */}
        <Route
            path="/checkout-summary/:bookingId"
            element={
                <CheckoutPage
                    cartItems={cartItems}
                    activeCurrency={activeCurrency}
                    isAuthenticated={isAuthenticated}
                    handleCheckoutSubmit={handleCheckoutSubmit}
                    itemDetails={itemDetails}
                    setItemDetails={setItemDetails}
                    token={token}
                    currentUser={currentUser}
                    BACKEND_URL={BACKEND_URL}
                    clearCart={clearCart}
                />
            }
        />

        {/* --- NEW: Routes for Payment Success and Failed Pages --- */}
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-failed" element={<PaymentFailed />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/verify-success" element={<VerifySuccess />} />
        <Route path="/verify-failed" element={<VerifyFailed />} />
        <Route path="/already-verified" element={<AlreadyVerified />} />
        <Route path="/verify-error" element={<VerifyError />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/payment-details/:bookingId" element={<SwiftCodePage />} />
        {/* --- END NEW ROUTES --- */}
    </Routes>
);

export default PublicRoutes;
