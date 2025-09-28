import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Tambahkan BiCheckCircle untuk ikon "Complete"
import { BiEdit, BiTrash, BiX, BiLoaderAlt, BiCheckCircle } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast'; // Menggunakan toast untuk notifikasi

// Variasi untuk modal konten, pastikan ini ada atau sesuaikan
const contentVariants = {
    hidden: { scale: 0.9, y: 20, opacity: 0 },
    visible: { scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { scale: 0.9, y: 20, opacity: 0, transition: { duration: 0.2 } },
};

// --- New Image Modal Component ---
const ImageModal = ({ isOpen, imageUrl, onClose }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[10003] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="p-4 relative"
                        variants={contentVariants}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-2 right-2 text-white text-3xl hover:text-gray-300"
                        >
                            <BiX />
                        </button>
                        <img src={imageUrl} alt="Enlarged booking item" className="max-w-full max-h-[80vh] rounded-lg shadow-lg" />
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
// --- End of Image Modal Component ---

function ManageOrders() {
    const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
    const navigate = useNavigate();

    const [rawBookings, setRawBookings] = useState([]);
    const [error, setError] = useState('');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [loading, setLoading] = useState(true); // Tambahkan state loading

    // State untuk modal Edit Booking
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [currentBooking, setCurrentBooking] = useState(null);

    // State untuk modal konfirmasi Delete
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);
    const [bookingToDelete, setBookingToDelete] = useState(null);

    // --- State baru untuk modal Complete Order ---
    const [completeModalOpen, setCompleteModalOpen] = useState(false);
    const [bookingToComplete, setBookingToComplete] = useState(null);
    const [ticketNumbers, setTicketNumbers] = useState([]);
    
    // New state for image modal
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');

    const BACKEND_URL = import.meta.env.VITE_API_URL;

    const userLanguage = 'en';
    const fetchOrders = useCallback(async () => {
        setLoading(true); // Mulai loading
        try {
            if (!authToken) {
                setError('Authentication token missing. Please log in again.');
                setLoading(false);
                return;
            }

            const response = await axios.get(`${BACKEND_URL}/api/bookings`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setRawBookings(response.data);
        } catch (err) {
            let errorMessage = 'Failed to fetch orders';
            if (err.response) {
                errorMessage = err.response.data.message || `Error ${err.response.status}`;
                if (err.response.status === 401 || err.response.status === 403) {
                    handleLogout();
                }
            } else if (err.request) {
                errorMessage = 'No response from server. Check if backend is running and accessible.';
            } else {
                errorMessage = err.message;
            }
            setError(errorMessage);
            console.error('Fetch orders error:', err);
        } finally {
            setLoading(false); // Selesai loading
        }
    }, [BACKEND_URL, authToken, handleLogout]);

    useEffect(() => {
        if (!isAuthReady) {
            return;
        }

        if (!isAuthenticated) {
            navigate('/login');
            return;
        }

        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        fetchOrders();
    }, [isAuthenticated, user, isAuthReady, navigate, fetchOrders]);

    const toggleSidebar = useCallback(() => {
        setSidebarOpen(!sidebarOpen);
    }, [sidebarOpen]);

    // --- Modal Edit Booking ---
    const openFormModal = useCallback((booking) => {
        setCurrentBooking(booking);
        setFormModalOpen(true);
        setError('');
    }, []);

    const closeFormModal = useCallback(() => {
        setFormModalOpen(false);
        setCurrentBooking(null);
        setError('');
    }, []);

    const handleStatusChange = useCallback((e) => {
        const { value } = e.target;
        setCurrentBooking((prev) => (prev ? { ...prev, status: value } : null));
    }, []);
    
    const handlePaymentStatusChange = useCallback((e) => {
        const { value } = e.target;
        setCurrentBooking((prev) => (prev ? { ...prev, paymentStatus: value } : null));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!authToken || !currentBooking?._id) {
            setError('Authentication token missing or booking ID is invalid.');
            return;
        }

        try {
            await axios.put(
                `${BACKEND_URL}/api/bookings/${currentBooking._id}/status`,
                { 
                    status: currentBooking.status,
                    paymentStatus: currentBooking.paymentStatus // Include paymentStatus in the update
                },
                { headers: { Authorization: `Bearer ${authToken}` } }
            );
            setRawBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking._id === currentBooking._id ? { ...booking, status: currentBooking.status, paymentStatus: currentBooking.paymentStatus } : booking
                )
            );
            closeFormModal();
            toast.success('Status pesanan berhasil diperbarui!');
        } catch (err) {
            const errorMessage = err.response?.data.message || 'Failed to update order status.';
            setError(errorMessage);
            console.error('Submit error:', err.response?.data || err);
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    }, [authToken, currentBooking, BACKEND_URL, closeFormModal, handleLogout]);

    // --- Modal Konfirmasi Delete ---
    const openConfirmModal = useCallback((booking) => {
        setBookingToDelete(booking);
        setConfirmModalOpen(true);
    }, []);

    const closeConfirmModal = useCallback(() => {
        setConfirmModalOpen(false);
        setBookingToDelete(null);
    }, []);

    const handleDelete = useCallback(async () => {
        if (!bookingToDelete) return;
        if (!authToken) {
            setError('Authentication token missing.');
            return;
        }

        try {
            await axios.delete(`${BACKEND_URL}/api/bookings/${bookingToDelete._id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            setRawBookings(prevBookings => prevBookings.filter(booking => booking._id !== bookingToDelete._id));
            closeConfirmModal();
            setError('');
            toast.success('Pesanan berhasil dihapus!');
        } catch (err) {
            const errorMessage = err.response?.data.message || 'Failed to delete booking.';
            setError(errorMessage);
            console.error('Delete error:', err.response?.data || err);
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
            closeConfirmModal();
        }
    }, [bookingToDelete, BACKEND_URL, authToken, handleLogout, closeConfirmModal]);

    // --- Fungsi baru untuk modal Complete Order ---
    const openCompleteModal = useCallback((booking) => {
        setBookingToComplete(booking);
        // Inisialisasi state ticketNumbers sesuai jumlah item
        const initialTicketNumbers = booking.items.map(item => ({
            itemId: item._id, // Gunakan item._id untuk identifikasi unik
            ticketNumber: '',
            itemName: item.itemId?.name || item.itemId?.title || item.itemId?.destination?.name || 'Unknown Item'
        }));
        setTicketNumbers(initialTicketNumbers);
        setCompleteModalOpen(true);
    }, []);

    const closeCompleteModal = useCallback(() => {
        setCompleteModalOpen(false);
        setBookingToComplete(null);
        setTicketNumbers([]); // Reset tiket saat modal ditutup
    }, []);

    const handleTicketChange = useCallback((index, value) => {
        setTicketNumbers(prevTickets =>
            prevTickets.map((ticket, i) =>
                i === index ? { ...ticket, ticketNumber: value } : ticket
            )
        );
    }, []);

    const handleCompleteSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!authToken || !bookingToComplete?._id) {
            setError('Authentication token missing or booking ID is invalid.');
            return;
        }

        // Siapkan payload yang sesuai dengan format backend
        const payload = {
            ticketDetails: ticketNumbers.map(ticket => ({
                itemId: ticket.itemId,
                ticketNumber: ticket.ticketNumber,
            })),
        };

        try {
            await axios.put(
                `${BACKEND_URL}/api/bookings/${bookingToComplete._id}/complete`, // <- Endpoint baru
                payload,
                { headers: { Authorization: `Bearer ${authToken}` } }
            );

            // Perbarui status booking di state lokal
            setRawBookings(prevBookings =>
                prevBookings.map(booking =>
                    booking._id === bookingToComplete._id ? { ...booking, status: 'completed' } : booking
                )
            );
            closeCompleteModal();
            toast.success('Pesanan berhasil diselesaikan dan nomor tiket disimpan!');
        } catch (err) {
            const errorMessage = err.response?.data.message || 'Failed to complete order and save tickets.';
            setError(errorMessage);
            console.error('Complete submit error:', err.response?.data || err);
            toast.error(errorMessage);
            if (err.response?.status === 401 || err.response?.status === 403) {
                handleLogout();
            }
        }
    }, [authToken, bookingToComplete, ticketNumbers, BACKEND_URL, closeCompleteModal, handleLogout]);
    
    // New functions to handle image modal
    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    const closeImageModal = () => {
        setIsImageModalOpen(false);
        setSelectedImage('');
    };

    // --- Render Loading State ---
    if (!isAuthReady || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
                <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
                <p className="text-lg font-medium">Memuat data...</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className="flex-1 md:ml-64">
                <AdminHeader toggleSidebar={toggleSidebar} />
                <div className="pt-20 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                            <strong className="font-bold">Error!</strong>
                            <span className="block sm:inline"> {error}</span>
                        </div>
                    )}
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-semibold text-havanaGray">Manage Orders</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Booking ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Username
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total Payment
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Booking Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Booking Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Payment Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {rawBookings.length === 0 && !error ? (
                                        <tr>
                                            <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                                                No orders found.
                                            </td>
                                        </tr>
                                    ) : (
                                        rawBookings.map((booking) => (
                                            <tr key={booking._id}>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {booking._id.substring(booking._id.length - 6)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {booking.user?.username || 'N/A'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {booking.currency} {booking.totalPrice.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {new Date(booking.createdAt).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric',
                                                    })}
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                                                          ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                          ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                                                          ${booking.status === 'completed' ? 'bg-blue-100 text-blue-800' : ''}`}
                                                    >
                                                        {booking.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">
                                                    <span
                                                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                                                          ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : ''}
                                                          ${booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                          ${booking.paymentStatus === 'waiting for verification' ? 'bg-orange-100 text-orange-800' : ''}
                                                          ${booking.paymentStatus === 'failed' || booking.paymentStatus === 'expired' ? 'bg-red-100 text-red-800' : ''}`}
                                                    >
                                                        {booking.paymentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button
                                                        onClick={() => openFormModal(booking)}
                                                        className="text-havanaBlue hover:text-blue-700 mr-2 transition"
                                                        title="Edit Booking Status / View Details"
                                                        aria-label={`Edit booking ${booking._id}`}
                                                    >
                                                        <BiEdit className="text-lg" />
                                                    </button>
                                                    {/* Tombol baru untuk Complete Order, hanya muncul jika status confirmed dan paid */}
                                                    {booking.status === 'confirmed' && booking.paymentStatus === 'paid' && (
                                                        <button
                                                            onClick={() => openCompleteModal(booking)}
                                                            className="text-green-500 hover:text-green-700 mr-2 transition"
                                                            title="Complete Order"
                                                            aria-label={`Complete order ${booking._id}`}
                                                        >
                                                            <BiCheckCircle className="text-lg" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => openConfirmModal(booking)}
                                                        className="text-red-500 hover:text-red-700 transition"
                                                        title="Delete Booking"
                                                        aria-label={`Delete booking ${booking._id}`}
                                                    >
                                                        <BiTrash className="text-lg" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Modal untuk Edit Booking / View Details */}
                {formModalOpen && currentBooking &&
                    createPortal(
                        <AnimatePresence>
                            <motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="relative bg-white rounded-lg p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl"
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <button
                                        onClick={closeFormModal}
                                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                                        aria-label="Close booking details modal"
                                    >
                                        <BiX className="text-2xl" />
                                    </button>
                                    <h3 className="text-lg font-semibold text-havanaGray mb-6">
                                        Booking Details (ID: {currentBooking._id.substring(currentBooking._id.length - 6)})
                                    </h3>
                                    <form onSubmit={handleSubmit}>
                                        <div className="space-y-4 mb-6">
                                            <div>
                                                <label htmlFor="bookingUserUsername" className="block text-sm font-medium text-gray-700">Booking User Username</label>
                                                <input
                                                    type="text"
                                                    id="bookingUserUsername"
                                                    value={currentBooking.user?.username || 'Unknown'}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
                                                    disabled
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="bookingUserEmail" className="block text-sm font-medium text-gray-700">Booking User Email</label>
                                                <input
                                                    type="text"
                                                    id="bookingUserEmail"
                                                    value={currentBooking.user?.email || 'Unknown'}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
                                                    disabled
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="totalPayment" className="block text-sm font-medium text-gray-700">Total Payment</label>
                                                <input
                                                    type="text"
                                                    id="totalPayment"
                                                    value={`${currentBooking.currency} ${currentBooking.totalPrice.toLocaleString()}`}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
                                                    disabled
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="createdAt" className="block text-sm font-medium text-gray-700">Created At</label>
                                                <input
                                                    type="text"
                                                    id="createdAt"
                                                    value={new Date(currentBooking.createdAt).toLocaleString()}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 sm:text-sm"
                                                    disabled
                                                />
                                            </div>
                                            {/* Display Payment Proof Image if it exists */}
                                            {currentBooking.paymentProofUrl && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700">Payment Proof</label>
                                                    <img
                                                        src={currentBooking.paymentProofUrl}
                                                        alt="Payment Proof"
                                                        className="w-32 h-32 object-cover rounded-md cursor-pointer mt-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openImageModal(currentBooking.paymentProofUrl);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            <h4 className="text-md font-semibold text-havanaGray mt-6 mb-2">Item Details:</h4>
                                            {currentBooking.items.map((item, itemIdx) => (
                                                <div key={item._id || itemIdx} className="border-t border-gray-200 pt-4 mt-4">
                                                    <p className="font-semibold mb-2">
                                                        Item: {item.itemId?.name || item.itemId?.title || item.itemId?.destination?.name || 'Unknown Item'}
                                                    </p>
                                                    {item.details.map((detail, detailIdx) => (
                                                        <div key={detailIdx} className="ml-4 border-l pl-4 my-2">
                                                            <p className="text-sm">Ticket {detailIdx + 1}:</p>
                                                            <p className="text-xs text-gray-600 font-semibold">Guest Name: {detail.name || 'N/A'}</p>
                                                            <p className="text-xs text-gray-600">Date: {new Date(detail.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                                            <p className="text-xs text-gray-600">Pickup: {detail.pickupLocation || 'N/A'}</p>
                                                            <p className="text-xs text-gray-600">Phone: {detail.phone}</p>
                                                            <p className="text-xs text-gray-600">Requests: {detail.specialRequests || 'None'}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                            <div>
                                                <label htmlFor="bookingStatus" className="block text-sm font-medium text-gray-700">Update Booking Status</label>
                                                <select
                                                    id="bookingStatus"
                                                    name="status"
                                                    value={currentBooking.status}
                                                    onChange={handleStatusChange}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                                                    required
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="confirmed">Confirmed</option>
                                                    <option value="cancelled">Cancelled</option>
                                                    <option value="completed">Completed</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">Update Payment Status</label>
                                                <select
                                                    id="paymentStatus"
                                                    name="paymentStatus"
                                                    value={currentBooking.paymentStatus}
                                                    onChange={handlePaymentStatusChange}
                                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                                                    required
                                                >
                                                    <option value="pending">Pending</option>
                                                    <option value="waiting for verification">Waiting for Verification</option>
                                                    <option value="paid">Paid</option>
                                                    <option value="failed">Failed</option>
                                                    <option value="expired">Expired</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex justify-end space-x-2 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={closeFormModal}
                                                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                            >
                                                Close
                                            </button>
                                            <button
                                                type="submit"
                                                className="py-2 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 transition"
                                            >
                                                Update Status
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>,
                        document.body
                    )}

                {/* Modal Konfirmasi Delete */}
                {confirmModalOpen &&
                    createPortal(
                        <AnimatePresence>
                            <motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="relative bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-center"
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <button
                                        onClick={closeConfirmModal}
                                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                                        aria-label="Close confirmation modal"
                                    >
                                        <BiX className="text-2xl" />
                                    </button>
                                    <h3 className="text-xl font-semibold text-red-600 mb-4">Konfirmasi Hapus</h3>
                                    <p className="text-gray-700 mb-6">
                                        Apakah Anda yakin ingin menghapus pemesanan ini (ID:{' '}
                                        <strong>{bookingToDelete?._id.substring(bookingToDelete._id.length - 6)}</strong>)?
                                        Tindakan ini tidak dapat dibatalkan.
                                    </p>
                                    <div className="flex justify-center space-x-4">
                                        <button
                                            onClick={closeConfirmModal}
                                            className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            onClick={handleDelete}
                                            className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                                        >
                                            Hapus
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>,
                        document.body
                    )}

                {/* --- Modal Baru untuk Complete Order --- */}
                {completeModalOpen && bookingToComplete &&
                    createPortal(
                        <AnimatePresence>
                            <motion.div
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            >
                                <motion.div
                                    className="relative bg-white rounded-lg p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl"
                                    variants={contentVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                >
                                    <button
                                        onClick={closeCompleteModal}
                                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                                        aria-label="Close complete order modal"
                                    >
                                        <BiX className="text-2xl" />
                                    </button>
                                    <h3 className="text-lg font-semibold text-havanaBlue mb-6">
                                        Selesaikan Pesanan (ID: {bookingToComplete._id.substring(bookingToComplete._id.length - 6)})
                                    </h3>
                                    <p className="text-sm text-gray-700 mb-4">
                                        Masukkan nomor tiket untuk setiap item di pesanan ini.
                                    </p>
                                    <form onSubmit={handleCompleteSubmit}>
                                        <div className="space-y-4 mb-6">
                                            {ticketNumbers.map((ticket, index) => (
                                                <div key={index}>
                                                    <label htmlFor={`ticket-number-${index}`} className="block text-sm font-medium text-gray-700">
                                                        Nomor Tiket untuk: <strong>{ticket.itemName}</strong>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        id={`ticket-number-${index}`}
                                                        value={ticket.ticketNumber}
                                                        onChange={(e) => handleTicketChange(index, e.target.value)}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                                                        placeholder="Contoh: TKT-12345"
                                                        required
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex justify-end space-x-2 pt-4 border-t">
                                            <button
                                                type="button"
                                                onClick={closeCompleteModal}
                                                className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                className="py-2 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 transition"
                                            >
                                                Selesaikan & Simpan
                                            </button>
                                        </div>
                                    </form>
                                </motion.div>
                            </motion.div>
                        </AnimatePresence>,
                        document.body
                    )}
                {/* New Image Modal component */}
                <ImageModal
                    isOpen={isImageModalOpen}
                    imageUrl={selectedImage}
                    onClose={closeImageModal}
                />
            </div>
        </div>
    );
}

export default ManageOrders;