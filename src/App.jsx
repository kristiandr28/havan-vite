// src/AppContent.jsx
import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import CartModal from './components/partials/CartModal';
import CheckoutModal from './components/partials/CheckoutModal';
import DetailModal from './pages/components/DetailModal';
import ItineraryModal from './pages/components/ItineraryModal';
import ImageModal from './pages/components/ImageModal';
import LoginModal from './components/partials/LoginModal';
import RegisterModal from './components/partials/RegisterModal';
import NotificationModal from './components/partials/NotificationModal';
import SocialButtons from './components/SocialButtons';
import LanguageSelector from './components/LanguageSelector'; // <--- Tambahkan ini
import useAppState from './hooks/useAppState';
import useAuth from './hooks/useAuth';
import AdminRoutes from './routes/AdminRoutes';
import PublicRoutes from './routes/PublicRoutes';
import { BiLoaderAlt } from 'react-icons/bi';
import io from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

function AppContent() {
    const location = useLocation();

    const {
        cartItems, setCartItems, itemDetails, setItemDetails, isCartModalOpen, openCartModal, closeCartModal,
        isCheckoutModalOpen, openCheckoutModal, closeCheckoutModal, isDetailModalOpen, selectedItemForDetail,
        detailModalType, detailModalDescriptionError, openDetailModal, closeDetailModal, isItineraryModalOpen,
        selectedItemForItinerary, openItineraryModal, closeItineraryModal, isImageModalOpen, selectedImageForModal,
        openImageModal, closeImageModal, activeCurrency, addToCart, removeFromCart, updateCartItemQuantity, clearCart,
    } = useAppState();

    const {
        user, authToken, isAuthenticated, isAuthReady, isLoginModalOpen, loginError, setLoginEmail, setLoginPassword,
        openLoginModal, closeLoginModal, handleLoginSubmit, handleGoogleLogin, handleFacebookLogin, handleRegisterClick,
        handleLogout, handleCheckoutSubmit, isRegisterModalOpen, openRegisterModal, closeRegisterModal,
        handleRegisterSubmit, handleGoogleRegister, handleFacebookRegister, setRegisterUsername, setRegisterEmail,
        setRegisterPassword, registerError, isLoading, handleLogin, loginEmail, loginPassword, registerUsername,
        registerEmail, registerPassword,
    } = useAuth({ clearCart });

    const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const isAdminRoute = location.pathname.startsWith('/admin');

    // --- STATE UNTUK NOTIFIKASI ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    // --- FUNGSI UNTUK MENGAMBIL NOTIFIKASI DARI BACKEND ---
    const fetchNotifications = async () => {
        if (!authToken) {
            console.log('Not authenticated, skipping notification fetch.');
            setNotifications([]);
            setUnreadCount(0);
            return;
        }
        try {
            console.log('Fetching notifications from backend...');
            const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            const fetchedNotifications = response.data;
            setNotifications(fetchedNotifications);
            const newUnreadCount = fetchedNotifications.filter(n => !n.read).length;
            setUnreadCount(newUnreadCount);
            console.log('Notifications fetched:', fetchedNotifications);
            console.log('Unread count:', newUnreadCount);
        } catch (error) {
            console.error('Error fetching notifications:', error.response?.data?.message || error.message);
        }
    };

    // --- FUNGSI UNTUK MENANDAI NOTIFIKASI SEBAGAI SUDAH DIBACA (Satu atau lebih notifikasi) ---
    const markNotificationsAsRead = async (idsToMark) => {
        if (!authToken || !idsToMark || idsToMark.length === 0) return;
        try {
            await axios.post(`${BACKEND_URL}/api/notifications/mark-as-read`, { notificationIds: idsToMark }, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setNotifications(prevNotifications =>
                prevNotifications.map(n => idsToMark.includes(n._id) ? { ...n, read: true } : n)
            );
            setUnreadCount(prevCount => Math.max(0, prevCount - idsToMark.length));
            console.log(`Marked ${idsToMark.length} notifications as read.`);
        } catch (error) {
            console.error('Error marking notifications as read:', error.response?.data?.message || error.message);
            toast.error('Failed to mark notifications as read.');
        }
    };

    // --- FUNGSI UNTUK MENANDAI SEMUA NOTIFIKASI SEBAGAI SUDAH DIBACA ---
    const markAllNotificationsAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        if (unreadIds.length > 0) {
            await markNotificationsAsRead(unreadIds);
            toast.success('All notifications marked as read!');
        }
    };

    // --- FUNGSI UNTUK MENGELOLA MODAL NOTIFIKASI ---
    const openNotificationModal = () => {
        setIsNotificationModalOpen(true);
        markAllNotificationsAsRead();
    };
    const closeNotificationModal = () => setIsNotificationModalOpen(false);

    // --- KONEKSI DAN PENANGANAN SOCKET.IO ---
    const socket = useRef(null);
    useEffect(() => {
        if (isAuthenticated && user && user._id && authToken && isAuthReady && !socket.current) {
            console.log("Attempting to connect to Socket.IO...");
            socket.current = io(BACKEND_URL, {
                auth: { token: authToken },
                transports: ['websocket', 'polling'],
            });

            socket.current.on('connect', () => {
                console.log('Socket.IO: Connected to server - ID:', socket.current.id);
                socket.current.emit('joinUserRoom', user._id);
                console.log(`Socket.IO: Joined user room for ID: ${user._id}`);
            });

            const handleSocketNotification = () => {
                fetchNotifications();
            };

            socket.current.on('newBookingForAdmin', (booking) => {
                console.log('Socket.IO: New booking for admin received:', booking);
                if (user?.role === 'admin') {
                    toast.success(`ADMIN: New Booking from ${booking.username || 'Unknown User'}!`);
                    handleSocketNotification();
                }
            });

            socket.current.on('bookingStatusChanged', ({ bookingId, newStatus, userId }) => {
                console.log('Socket.IO: Booking status changed:', { bookingId, newStatus, userId });
                if (user?.role === 'admin') {
                    toast.info(`ADMIN: Booking ID ${bookingId} status updated to: ${newStatus}`);
                    handleSocketNotification();
                } else if (user?._id === userId) {
                    toast.info(`Your Booking (${bookingId}) status changed to: ${newStatus}`);
                    handleSocketNotification();
                }
            });

            socket.current.on('userBookingPending', (booking) => {
                console.log('Socket.IO: User booking pending:', booking);
                if (user?._id === booking.userId) {
                    toast.info(`Your booking (${booking._id}) is pending confirmation.`);
                    handleSocketNotification();
                }
            });

            socket.current.on('bookingConfirmed', (booking) => {
                console.log('Socket.IO: Your booking confirmed:', booking);
                if (user?._id === booking.userId) {
                    toast.success(`Your Booking (${booking._id}) has been CONFIRMED!`);
                    handleSocketNotification();
                }
            });

            socket.current.on('bookingCancelled', (booking) => {
                console.log('Socket.IO: Your booking cancelled:', booking);
                if (user?._id === booking.userId) {
                    toast.error(`Your Booking (${booking._id}) has been CANCELLED.`);
                    handleSocketNotification();
                }
            });

            socket.current.on('bookingCancelledByCustomer', (booking) => {
                console.log('Socket.IO: Booking cancelled by customer:', booking);
                if (user?.role === 'admin') {
                    toast.warn(`ADMIN: Booking ${booking._id} cancelled by ${booking.username || 'a customer'}.`);
                    handleSocketNotification();
                }
            });

            socket.current.on('bookingDeletedForAdmin', ({ bookingId }) => {
                console.log('Socket.IO: Booking deleted for admin:', bookingId);
                if (user?.role === 'admin') {
                    toast.error(`ADMIN: Booking ID ${bookingId} has been deleted.`);
                    handleSocketNotification();
                }
            });

            socket.current.on('bookingDeletedForUser', ({ bookingId, userId }) => {
                console.log('Socket.IO: Booking deleted for user:', bookingId);
                if (user?._id === userId) {
                    toast.error(`Your Booking (${bookingId}) has been deleted by an admin.`);
                    handleSocketNotification();
                }
            });

            socket.current.on('connect_error', (err) => {
                console.error('Socket.IO Connection Error:', err.message);
            });

            socket.current.on('disconnect', (reason) => {
                console.log('Socket.IO: Disconnected - Reason:', reason);
            });

            return () => {
                if (socket.current) {
                    console.log('Socket.IO: Disconnecting...');
                    socket.current.offAny();
                    if (user && user._id) {
                        socket.current.emit('leaveUserRoom', user._id);
                    }
                    socket.current.disconnect();
                    socket.current = null;
                }
            };
        } else if (!isAuthenticated && socket.current) {
            console.log("User logged out or not authenticated, disconnecting Socket.IO...");
            if (user && user._id) {
                socket.current.emit('leaveUserRoom', user._id);
            }
            socket.current.disconnect();
            socket.current = null;
        }
    }, [isAuthenticated, user, authToken, isAuthReady, BACKEND_URL]);

    // --- useEffect terpisah untuk fetch notifikasi saat mount atau auth status berubah ---
    useEffect(() => {
        if (isAuthenticated && user && authToken) {
            fetchNotifications();
        } else {
            setNotifications([]);
            setUnreadCount(0);
        }
    }, [isAuthenticated, user, authToken]);

    // Debugging logs
    useEffect(() => {
        console.group('AppContent State Update:');
        console.log('   isAuthReady:', isAuthReady);
        console.log('   isAuthenticated (dari useAuth):', isAuthenticated);
        console.log('   user (dari useAuth):', user);
        console.log('   authToken (dari useAuth):', authToken ? 'exists' : 'null');
        console.log('   unreadCount:', unreadCount);
        if (user) {
            console.log('   User Detail:');
            console.log('     ID:', user._id);
            console.log('     Username:', user.username);
            console.log('     Role:', user.role);
        } else {
            console.log('   User: null (tidak ada pengguna yang login)');
        }
        console.groupEnd();

        if (isAuthReady) {
            console.log('--- Autentikasi Siap! ---');
        }
    }, [isAuthReady, isAuthenticated, user, authToken, unreadCount]);

    const bookingModalProps = {
        openCheckoutModal,
        activeCurrency,
        handleCheckoutSubmit,
        addToCart,
        BACKEND_URL,
    };

    const [contact, setContact] = useState(null);

    useEffect(() => {
    const fetchContact = async () => {
        try {
        const res = await axios.get(`${BACKEND_URL}/api/contacts`);
        if (res.data.length > 0) {
            setContact(res.data[0]); // ambil yang pertama
        }
        } catch (err) {
        console.error("Error fetching contact:", err.message);
        }
    };
    fetchContact();
    }, [BACKEND_URL]);


    if (!isAuthReady) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
                <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
                <p className="text-lg font-medium">Memuat aplikasi dan status autentikasi...</p>
                <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-100 font-inter">
            <Routes>
                <Route
                    path="/admin/*"
                    element={<AdminRoutes isAuthenticated={isAuthenticated} BACKEND_URL={BACKEND_URL} />}
                />
                <Route
                    path="/*"
                    element={
                        <>
                            <Header
                                cartItemCount={cartItems.length}
                                openCartModal={openCartModal}
                                openDetailModal={openDetailModal}
                                isAuthenticated={isAuthenticated}
                                handleLogout={handleLogout}
                                openLoginModal={openLoginModal}
                                user={user}
                                authToken={authToken}
                                openRegisterModal={openRegisterModal}
                                newNotificationsCount={unreadCount}
                                onOpenNotificationModal={openNotificationModal}
                                onMarkAllNotificationsAsRead={markAllNotificationsAsRead}
                            />
                            <main className="flex-grow">
                                <PublicRoutes
                                    openDetailModal={openDetailModal}
                                    activeCurrency={activeCurrency}
                                    BACKEND_URL={BACKEND_URL}
                                    isAuthenticated={isAuthenticated}
                                    currentUser={user}
                                    handleCheckoutSubmit={handleCheckoutSubmit}
                                    cartItems={cartItems}
                                    itemDetails={itemDetails}
                                    setItemDetails={setItemDetails}
                                    token={authToken}
                                    clearCart={clearCart}
                                    {...bookingModalProps}
                                />
                            </main>
                            <Footer />
                        </>
                    }
                />
            </Routes>

            {!isAdminRoute && (
                <>
                    <CartModal
                        isOpen={isCartModalOpen}
                        closeModal={closeCartModal}
                        cartItems={cartItems}
                        removeFromCart={removeFromCart}
                        updateCartItemQuantity={updateCartItemQuantity}
                        activeCurrency={activeCurrency}
                        openCheckoutModal={openCheckoutModal}
                        isAuthenticated={isAuthenticated}
                        handleLogin={handleLogin}
                    />
                    <CheckoutModal
                        isOpen={isCheckoutModalOpen}
                        closeModal={closeCheckoutModal}
                        cartItems={cartItems}
                        activeCurrency={activeCurrency}
                        isAuthenticated={isAuthenticated}
                        handleLogin={handleLogin}
                        handleCheckoutSubmit={handleCheckoutSubmit}
                        itemDetails={itemDetails}
                        setItemDetails={setItemDetails}
                        token={authToken}
                        currentUser={user}
                    />
                    <DetailModal
                        isOpen={isDetailModalOpen}
                        closeModal={closeDetailModal}
                        selectedItem={selectedItemForDetail}
                        modalType={detailModalType}
                        activeCurrency={activeCurrency}
                        openItineraryModal={openItineraryModal}
                        openImageModal={openImageModal}
                        isFromBookingModal={false}
                        descriptionError={detailModalDescriptionError}
                        BACKEND_URL={BACKEND_URL}
                        addToCart={addToCart}
                    />
                    <ItineraryModal
                        isOpen={isItineraryModalOpen}
                        closeModal={closeItineraryModal}
                        selectedItem={selectedItemForItinerary}
                        BACKEND_URL={BACKEND_URL}
                        activeCurrency={activeCurrency}
                    />
                    <ImageModal
                        isOpen={isImageModalOpen}
                        closeModal={closeImageModal}
                        imageUrl={selectedImageForModal}
                    />
                    <LoginModal
                        isOpen={isLoginModalOpen}
                        closeModal={closeLoginModal}
                        handleLoginSubmit={handleLoginSubmit}
                        handleGoogleLogin={handleGoogleLogin}
                        handleFacebookLogin={handleFacebookLogin}
                        handleRegisterClick={handleRegisterClick}
                        loginEmail={loginEmail}
                        setLoginEmail={setLoginEmail}
                        loginPassword={loginPassword}
                        setLoginPassword={setLoginPassword}
                        loginError={loginError}
                        isLoading={isLoading}
                    />
                    <RegisterModal
                        isOpen={isRegisterModalOpen}
                        closeModal={closeRegisterModal}
                        handleRegisterSubmit={handleRegisterSubmit}
                        handleGoogleRegister={handleGoogleRegister}
                        handleFacebookRegister={handleFacebookRegister}
                        handleLoginClick={openLoginModal}
                        registerUsername={registerUsername}
                        setRegisterUsername={setRegisterUsername}
                        registerEmail={registerEmail}
                        setRegisterEmail={setRegisterEmail}
                        registerPassword={registerPassword}
                        setRegisterPassword={setRegisterPassword}
                        registerError={registerError}
                        isFirebaseRegister={false}
                        isLoading={isLoading}
                    />
                    <NotificationModal
                        isOpen={isNotificationModalOpen}
                        closeModal={closeNotificationModal}
                        user={user}
                        token={authToken}
                        BACKEND_URL={BACKEND_URL}
                        notifications={notifications}
                        onMarkAsRead={markNotificationsAsRead}
                    />
                    <LanguageSelector />
                    {/* 👇 Updated to use the new SocialButtons component */}

                    {contact && (
                    <SocialButtons
                        whatsappUrl={`https://wa.me/${contact.whatsapp}?text=${encodeURIComponent("Halo, saya ingin bertanya tentang paket tur.")}`}
                        lineUrl={`https://line.me/ti/p/${contact.socialMedia.line}`}
                        wechatUrl={`weixin://dl/chat?${contact.socialMedia.wechat}`}
                    />
                    )}
                </>
            )}

            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
        </div>
    );
}

export default function AppWrapper() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}