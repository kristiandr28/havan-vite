import React, { useState, useEffect, useRef } from 'react';
import { BiMenu, BiLogOut, BiCog, BiUser, BiChevronDown, BiBell } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';
import io from 'socket.io-client';
import { toast } from 'react-toastify';
import NotificationModal from './partials/NotificationModal'; // Pastikan path ini benar
import { createPortal } from 'react-dom';

const BACKEND_URL = import.meta.env.VITE_API_URL;

function AdminHeader({ toggleSidebar }) {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [username, setUsername] = useState('Admin');
    const dropdownRef = useRef(null);
    const [authToken, setAuthToken] = useState(null);

    // --- State & Functions for Notifications ---
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
    const socket = useRef(null);

    // Fungsi untuk mengambil notifikasi admin dari backend
    const fetchAdminNotifications = async (token) => {
        if (!token) return;
        try {
            const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications(response.data);
            const count = response.data.filter(n => !n.read).length;
            setUnreadCount(count);
        } catch (error) {
            console.error('Error fetching admin notifications:', error.response?.data?.message || error.message);
        }
    };

    // Fungsi untuk menandai notifikasi sebagai sudah dibaca
    const markNotificationsAsRead = async (idsToMark) => {
        if (!authToken || idsToMark.length === 0) return;
        try {
            await axios.post(`${BACKEND_URL}/api/notifications/mark-as-read`, { notificationIds: idsToMark }, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setNotifications(prev =>
                prev.map(n => (idsToMark.includes(n._id) ? { ...n, read: true } : n))
            );
            setUnreadCount(prev => Math.max(0, prev - idsToMark.length));
        } catch (error) {
            console.error('Error marking notifications as read:', error);
            toast.error('Failed to mark notifications as read.');
        }
    };

    // Fungsi untuk membuka modal notifikasi dan menandai semua notif sebagai sudah dibaca
    const openNotificationModal = () => {
        setIsNotificationModalOpen(true);
        const unreadIds = notifications.filter(n => !n.read).map(n => n._id);
        if (unreadIds.length > 0) {
            markNotificationsAsRead(unreadIds);
        }
    };

    const closeNotificationModal = () => {
        setIsNotificationModalOpen(false);
    };

    // --- useEffect Hooks ---
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        setAuthToken(token); // Simpan token di state
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUsername(decoded.username || decoded.name || decoded.email || 'Admin');
                // Panggil fetch notifikasi saat token valid
                fetchAdminNotifications(token);
            } catch (err) {
                console.error('JWT decode error in AdminHeader:', err);
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                navigate('/login');
            }
        }
    }, [navigate]);

    useEffect(() => {
        if (authToken && !socket.current) {
            console.log("AdminHeader: Connecting to Socket.IO...");
            socket.current = io(BACKEND_URL, {
                auth: { token: authToken },
                transports: ['websocket', 'polling'],
            });

            socket.current.on('connect', () => {
                console.log('AdminHeader: Socket.IO connected.');
            });

            socket.current.on('newBookingForAdmin', (booking) => {
                toast.success(`NEW BOOKING: from ${booking.username || 'a user'}.`);
                fetchAdminNotifications(authToken); // Ambil notifikasi baru
            });

            socket.current.on('bookingStatusChanged', ({ newStatus }) => {
                toast.info(`BOOKING STATUS: a booking status has been changed to ${newStatus}.`);
                fetchAdminNotifications(authToken);
            });
            
            socket.current.on('bookingCancelledByCustomer', (booking) => {
                toast.warn(`CANCELLATION: Booking ${booking._id} was cancelled by a customer.`);
                fetchAdminNotifications(authToken);
            });

            socket.current.on('connect_error', (err) => {
                console.error('AdminHeader: Socket.IO Connection Error:', err.message);
            });

            return () => {
                if (socket.current) {
                    console.log('AdminHeader: Disconnecting Socket.IO...');
                    socket.current.disconnect();
                    socket.current = null;
                }
            };
        }
    }, [authToken]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setIsDropdownOpen(false);
        if (socket.current) {
            socket.current.disconnect();
        }
        navigate('/');
    };

    const handleNavigation = (path) => {
        setIsDropdownOpen(false);
        navigate(path);
    };

    return (
        <>
            <header className="bg-white shadow-sm fixed top-0 md:left-64 w-full md:w-[calc(100%-16rem)] z-10">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
                    <div className="flex items-center">
                        <button
                            className="md:hidden text-havanaGray hover:text-havanaBlue mr-4"
                            onClick={toggleSidebar}
                            aria-label="Toggle sidebar"
                        >
                            <BiMenu className="text-2xl" />
                        </button>
                    </div>
                    <div className="flex items-center space-x-4">
                        {/* Tombol Notifikasi */}
                        <button
                            onClick={openNotificationModal}
                            className="relative p-2 rounded-full hover:bg-gray-100"
                            aria-label="View notifications"
                        >
                            <BiBell className="text-havanaGray text-2xl" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full animate-pulse">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Profil Admin */}
                        <div className="relative" ref={dropdownRef}>
                            <span
                                onClick={toggleDropdown}
                                className="text-havanaGray text-sm cursor-pointer truncate max-w-[150px] flex items-center"
                                role="button"
                                tabIndex={0}
                                aria-label={`User menu for ${username}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        toggleDropdown();
                                    }
                                }}
                            >
                                Welcome, {username}
                                <BiChevronDown className={`ml-1 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                            </span>
                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white shadow-sm rounded-md py-1 z-20">
                                    <button
                                        onClick={() => handleNavigation('/admin/settings')}
                                        className="w-full text-left px-4 py-2 text-sm text-havanaGray hover:bg-gray-100 flex items-center"
                                    >
                                        <BiCog className="mr-2" />
                                        Settings
                                    </button>
                                    <button
                                        onClick={() => handleNavigation('/admin/profile')}
                                        className="w-full text-left px-4 py-2 text-sm text-havanaGray hover:bg-gray-100 flex items-center"
                                    >
                                        <BiUser className="mr-2" />
                                        Profile
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            window.location.reload();
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 flex items-center"
                                    >
                                        <BiLogOut className="mr-2" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal Notifikasi */}
            {isNotificationModalOpen && createPortal(
                <NotificationModal
                    isOpen={isNotificationModalOpen}
                    closeModal={closeNotificationModal}
                    user={{ _id: 'admin_id_placeholder', username: username }} // Kirim data user yang relevan
                    token={authToken}
                    BACKEND_URL={BACKEND_URL}
                    notifications={notifications}
                    onMarkAsRead={markNotificationsAsRead}
                />,
                document.body
            )}
        </>
    );
}

export default AdminHeader;
