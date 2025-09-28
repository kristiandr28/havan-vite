import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { createPortal } from 'react-dom';

// Impor ikon yang diperlukan
import { BiMap, BiCart, BiCog, BiUser, BiLogOut, BiGridAlt, BiBell } from 'react-icons/bi';
import NavMenu from './partials/NavMenu';
import ContactModal from './partials/ContactModal';
import AboutModal from './partials/AboutModal';
import NotificationModal from './partials/NotificationModal';
import TicketModal from './partials/TicketModal';
import ProfileModal from './partials/ProfileModal';
import DashboardModal from './partials/DashboardModal';
import { dropdownVariants } from './partials/modalVariants';
import useAuth from '../hooks/useAuth';

// --- UserDropdown Component (Ditempatkan di sini untuk kemudahan) ---
function UserDropdown({ user, authToken, handleNavigation, handleLogout, openProfileModal, openDashboardModal }) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [profilePicture, setProfilePicture] = useState('');
    const dropdownRef = useRef(null);
    const BACKEND_URL = import.meta.env.VITE_API_URL;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user && authToken) {
            fetchProfilePicture();
        } else {
            setProfilePicture('');
        }
    }, [user, authToken]);

    const fetchProfilePicture = async () => {
        try {
            if (!authToken) return;
            const response = await axios.get(`${BACKEND_URL}/api/profile`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setProfilePicture(response.data.profilePicture ? `${BACKEND_URL}${response.data.profilePicture}` : '');
        } catch (err) {
            console.error('Failed to fetch profile picture:', err);
            setProfilePicture('');
        }
    };

    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const getInitial = () => {
        const source = user?.email || user?.username || 'A';
        return source.charAt(0).toUpperCase();
    };

    return (
        <div className="relative flex items-center" ref={dropdownRef}>
            <div
                onClick={toggleDropdown}
                className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-havanaBlue text-white
                           transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-havanaBlue focus:ring-opacity-50"
                role="button"
                tabIndex={0}
                aria-label={`User menu for ${user?.username || user?.email || 'User'}`}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        toggleDropdown();
                    }
                }}
            >
                {profilePicture ? (
                    <img
                        src={profilePicture}
                        alt="Profile"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            setProfilePicture('');
                        }}
                    />
                ) : (
                    <span className="text-sm font-bold">{getInitial()}</span>
                )}
            </div>

            <AnimatePresence>
                {isDropdownOpen && (
                    <motion.div
                        className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg bg-white/95 py-1 shadow-lg backdrop-blur-sm"
                        variants={dropdownVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        key="dropdown"
                    >
                        <button
                            onClick={() => {
                                openDashboardModal();
                                setIsDropdownOpen(false);
                            }}
                            className="flex w-full items-center px-4 py-2 text-[12px] text-gray-700 transition-colors duration-150 hover:bg-havanaLightBlue/20 hover:text-havanaBlue sm:text-sm text-left"
                        >
                            <BiGridAlt className="mr-2" />
                            Dashboard
                        </button>
                        <button
                            onClick={() => {
                                handleNavigation('/settings');
                                setIsDropdownOpen(false);
                            }}
                            className="flex w-full items-center px-4 py-2 text-[12px] text-gray-700 transition-colors duration-150 hover:bg-havanaLightBlue/20 hover:text-havanaBlue sm:text-sm text-left"
                        >
                            <BiCog className="mr-2" />
                            Settings
                        </button>
                        <button
                            onClick={() => {
                                openProfileModal();
                                setIsDropdownOpen(false);
                            }}
                            className="flex w-full items-center px-4 py-2 text-[12px] text-gray-700 transition-colors duration-150 hover:bg-havanaLightBlue/20 hover:text-havanaBlue sm:text-sm text-left"
                        >
                            <BiUser className="mr-2" />
                            Profile
                        </button>
                        <button
                            onClick={() => {
                                handleLogout();
                                setIsDropdownOpen(false);
                            }}
                            className="flex w-full items-center px-4 py-2 text-[12px] text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 sm:text-sm text-left"
                        >
                            <BiLogOut className="mr-2" />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Komponen Header Utama ---
function Header({
    cartItemCount,
    openCartModal,
    openDetailModal,
    isAuthenticated,
    handleLogout,
    openLoginModal,
    user,
    authToken,
    openRegisterModal,
    // --- PROPS PENTING UNTUK NOTIFIKASI ---
    newNotificationsCount,
    onOpenNotificationModal,
    onMarkAllNotificationsAsRead,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    const [modalOpen, setModalOpen] = useState(false);
    const [aboutModalOpen, setAboutModalOpen] = useState(false);
    const [ticketModalOpen, setTicketModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [dashboardModalOpen, setDashboardModalOpen] = useState(false);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const [contact, setContact] = useState(null);
    const [about, setAbout] = useState(null);
    const [tickets, setTickets] = useState([]);
    const [error, setError] = useState('');


    // --- STATE UNTUK MODAL NOTIFIKASI ---
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

    const BACKEND_URL = import.meta.env.VITE_API_URL|| 'http://localhost:5000';
    const activeCurrency = { code: 'IDR' };

    useEffect(() => {
        if (isAdminRoute) {
            setModalOpen(false);
            setAboutModalOpen(false);
            setTicketModalOpen(false);
            setProfileModalOpen(false);
            setDashboardModalOpen(false);
            setIsNotificationModalOpen(false);
        }
    }, [isAdminRoute]);

    // Menangani klik tombol notifikasi
    const handleNotificationClick = () => {
        setIsNotificationModalOpen(true);
        // Memanggil fungsi dari parent untuk membuka modal dan menandai sudah dibaca
        if (onOpenNotificationModal) {
            onOpenNotificationModal();
        }
        // Fungsi onMarkAllNotificationsAsRead bisa dipanggil di sini juga jika diperlukan, 
        // atau biarkan di dalam NotificationModal
    };

    // Fungsi-fungsi untuk membuka modal lainnya
    const handleContactClick = async () => {
        setModalOpen(true);
        setError('');
        try {
            const response = await axios.get(`${BACKEND_URL}/api/contacts`);
            setContact(response.data[0] || null);
            if (!response.data[0]) setError('No contact information available');
        } catch (err) {
            console.error('Failed to fetch contact:', err);
            setError(err.response?.data.message || 'Failed to fetch contact');
        }
    };

    const handleAboutClick = async () => {
        setAboutModalOpen(true);
        setError('');
        try {
            const response = await axios.get(`${BACKEND_URL}/api/about`);
            setAbout(response.data[0] || null);
            if (!response.data[0]) setError('No about information available');
        } catch (err) {
            console.error('Failed to fetch about information:', err);
            setError(err.response?.data.message || 'Failed to fetch about information');
        }
    };

    const handleTicketsClick = async () => {
    setTicketModalOpen(true);
    setError('');
    try {
        const ticketsRes = await axios.get(
        `${BACKEND_URL}/api/tickets`
        );

        const ticketsData = Array.isArray(ticketsRes.data.tickets) ? ticketsRes.data.tickets : [];

        const validTickets = ticketsData
          .filter(
            (ticket) =>
              ticket.price != null &&
              ticket.pax != null &&
              ticket.pax >= 1 &&
              ticket.destination != null &&
              ticket.ticketType?.length > 0 &&
              ticket.description?.length <= 3000
          )

        .slice(0, 6)
        .map((ticket) => ({
            ...ticket,
            // 🔹 langsung ambil nama kategori dari backend (sudah sesuai current lang)
            categoryName: ticket.category?.translations?.[0]?.name || '',
        }));

        setTickets(validTickets);

        if (!validTickets.length) setError('No valid tickets available');
    } catch (err) {
        console.error('Failed to fetch tickets:', err);
        setError(err.response?.data.message || 'Failed to fetch tickets');
    }
    setIsNavOpen(false);
    };

    const openProfileModal = () => {
        setProfileModalOpen(true);
        setIsNavOpen(false);
    };

    const openDashboardModal = () => {
        setDashboardModalOpen(true);
        setIsNavOpen(false);
    };

    const handleProfileUpdate = (updatedProfile) => {
        console.warn("Header: handleProfileUpdate called. This function is a placeholder and should be handled by the parent component.");
    };

    const handleNavigation = (path) => {
        setIsNavOpen(false);
        navigate(path);
    };

    const handleRegisterClick = () => {
        if (openRegisterModal) {
            openRegisterModal();
        }
        setIsNavOpen(false);
    };

    if (isAdminRoute) return null;

    return (
        <>
            <header className="bg-white shadow-sm fixed top-0 w-full z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                            <BiMap className="text-havanaPink sm:text-3xl text-2xl" />
                            <h1 className="sm:text-2xl text-xl font-bold text-havanaPink">Havana</h1>
                        </div>

                        <NavMenu
                            user={user}
                            isNavOpen={isNavOpen}
                            setIsNavOpen={setIsNavOpen}
                            handleTicketsClick={handleTicketsClick}
                            handleAboutClick={handleAboutClick}
                            handleContactClick={handleContactClick}
                            handleLoginClick={openLoginModal}
                            openRegisterModal={handleRegisterClick}
                        />

                        <div className="flex items-center space-x-4">
                            {isAuthenticated && (
                                <button
                                    onClick={handleNotificationClick}
                                    className="relative p-2 rounded-full hover:bg-gray-100"
                                    aria-label="View notifications"
                                >
                                    <BiBell className="text-havanaGray sm:text-2xl text-xl" />
                                    {/* Indikator notifikasi baru */}
                                    {newNotificationsCount > 0 && (
                                        <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-bounce">
                                            {newNotificationsCount > 9 ? '9+' : newNotificationsCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            <button
                                onClick={openCartModal}
                                className="relative p-2 rounded-full hover:bg-gray-100"
                                aria-label="View cart"
                            >
                                <BiCart className="text-havanaGray sm:text-2xl text-xl" />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                                        {cartItemCount}
                                    </span>
                                )}
                            </button>

                            {isAuthenticated && user ? (
                                <UserDropdown
                                    user={user}
                                    authToken={authToken}
                                    handleNavigation={handleNavigation}
                                    handleLogout={handleLogout}
                                    openProfileModal={openProfileModal}
                                    openDashboardModal={openDashboardModal}
                                />
                            ) : (
                                <button
                                    onClick={openLoginModal}
                                    className="hidden sm:block bg-white text-havanaBlue border border-havanaBlue py-1.5 px-4 rounded-full text-sm font-semibold hover:bg-havanaBlue hover:text-white transition"
                                >
                                    Login
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal Notifikasi */}
            {isNotificationModalOpen &&
                createPortal(
                    <NotificationModal
                        isOpen={isNotificationModalOpen}
                        closeModal={() => setIsNotificationModalOpen(false)}
                        user={user}
                        token={authToken}
                        BACKEND_URL={BACKEND_URL}
                        // Prop onModalOpen yang Anda gunakan di AppContent bisa diletakkan di sini,
                        // atau biarkan logika reset notifikasi ada di `handleNotificationClick`
                        onModalOpen={onMarkAllNotificationsAsRead} // Menggunakan prop yang sudah ada
                    />,
                    document.body
                )}

            {/* Modal lainnya tetap sama */}
            {modalOpen && createPortal(<ContactModal isOpen={modalOpen} closeModal={() => setModalOpen(false)} contact={contact} error={error} />, document.body)}
            {aboutModalOpen && createPortal(<AboutModal isOpen={aboutModalOpen} closeModal={() => setAboutModalOpen(false)} about={about} error={error} BACKEND_URL={BACKEND_URL} />, document.body)}
            {ticketModalOpen && createPortal(<TicketModal isOpen={ticketModalOpen} closeModal={() => setTicketModalOpen(false)} tickets={tickets} error={error} activeCurrency={activeCurrency} openDetailModal={openDetailModal} />, document.body)}
            {profileModalOpen && createPortal(<ProfileModal isOpen={profileModalOpen} closeModal={() => setProfileModalOpen(false)} user={user} token={authToken} onProfileUpdate={handleProfileUpdate} />, document.body)}
            {dashboardModalOpen && createPortal(<DashboardModal isOpen={dashboardModalOpen} closeModal={() => setDashboardModalOpen(false)} user={user} />, document.body)}
        </>
    );
}

export default Header;
