import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiX, BiLoaderAlt, BiChevronDown, BiChevronUp, BiCreditCard, BiFile, BiPrinter } from 'react-icons/bi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// --- Custom Modal Component for confirmations and messages (No change needed here) ---
const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const contentVariants = {
  hidden: { scale: 0.9, y: 20, opacity: 0 },
  visible: { scale: 1, y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
  exit: { scale: 0.9, y: 20, opacity: 0, transition: { duration: 0.2 } },
};

const CustomModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
  const { t } = useTranslation(); // Initialize useTranslation
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onCancel}
        >
          <motion.div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="mb-2 text-lg font-semibold text-gray-800">{t(title)}</h4>
            <p className="mb-4 text-sm text-gray-600">{t(message)}</p>
            <div className="flex justify-end space-x-2">
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  className="rounded-md bg-red-500 px-4 py-2 font-medium text-white transition-colors duration-200 hover:bg-red-600"
                >
                  {t('checkoutModal.confirm')}
                </button>
              )}
              <button
                onClick={onCancel}
                className="rounded-md bg-gray-200 px-4 py-2 font-medium text-gray-800 transition-colors duration-200 hover:bg-gray-300"
              >
                {onConfirm ? t('checkoutModal.cancel') : t('checkoutModal.close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// --- Image Modal Component (No change needed here) ---
const ImageModal = ({ isOpen, imageUrl, onClose }) => {
  const { t } = useTranslation(); // Initialize useTranslation
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
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
              aria-label={t('checkoutModal.aria.closeImageModal')}
            >
              <BiX />
            </button>
            <img src={imageUrl} alt={t('checkoutModal.imageModalAlt')} className="max-w-full max-h-[80vh] rounded-lg shadow-lg" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

function DashboardModal({ isOpen, closeModal, user }) {
  // Ambil i18n instance untuk mendapatkan kode bahasa aktif
  const { t, i18n } = useTranslation(); 
  
  const [activeTab, setActiveTab] = useState('account');
  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [error, setError] = useState('');
  const [invoicesError, setInvoicesError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [expandedBooking, setExpandedBooking] = useState(null);
  const [expandedInvoice, setExpandedInvoice] = useState(null);
  const [processingBookingId, setProcessingBookingId] = useState(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({});
  const [isPrinting, setIsPrinting] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_URL|| 'http://localhost:5000';
  const navigate = useNavigate();

  // Dapatkan kode bahasa aktif dari i18n
  const currentLanguage = i18n.language || 'en';

  useEffect(() => {
    if (activeTab === 'booking' && user?.id) {
      fetchBookings();
    }
    if (activeTab === 'invoice' && user?.id) {
      fetchInvoices();
    }
  }, [activeTab, user]);

  // --- PERBAIKAN: Menambahkan parameter `lang` ke request Axios ---
  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError(t('checkoutModal.errors.tokenMissing'));
        return;
      }
      const response = await axios.get(`${BACKEND_URL}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          lang: currentLanguage, // Kirim kode bahasa aktif sebagai parameter query
        }
      });
      console.log('DashboardModal: Fetched bookings:', response.data);
      setBookings(response.data);
      if (!response.data.length) {
        setError(t('checkoutModal.errors.noBookingsFound'));
      }
    } catch (err) {
      console.error('DashboardModal: Error fetching bookings:', err);
      setError(
        err.response?.status === 403
          ? t('checkoutModal.errors.accessDenied')
          : err.response?.data.message || t('checkoutModal.errors.fetchBookingsFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  // --- PERBAIKAN: Menambahkan parameter `lang` ke request Axios ---
  const fetchInvoices = async () => {
    setInvoicesLoading(true);
    setInvoicesError('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setInvoicesError(t('checkoutModal.errors.tokenMissing'));
        return;
      }
      const response = await axios.get(`${BACKEND_URL}/api/bookings/user`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          lang: currentLanguage, // Kirim kode bahasa aktif sebagai parameter query
        }
      });
      const invoicesData = response.data.filter((booking) => booking.paymentStatus === 'paid');
      setInvoices(invoicesData);
      if (!invoicesData.length) {
        setInvoicesError(t('checkoutModal.errors.noInvoicesFound'));
      }
    } catch (err) {
      console.error('DashboardModal: Error fetching invoices:', err);
      setInvoicesError(t('checkoutModal.errors.fetchInvoicesFailed'));
    } finally {
      setInvoicesLoading(false);
    }
  };
  // --- Akhir Perbaikan Fetching ---


  const getBookingDetails = (booking) => {
    let statusLabel = t('checkoutModal.status.na');
    let statusColor = 'bg-gray-200 text-gray-800';
    let paymentLabel = t('checkoutModal.paymentStatus.na');
    let paymentColor = 'bg-gray-200 text-gray-800';
    let progressWidth = 0;

    if (booking.status === 'pending') {
      statusLabel = t('checkoutModal.status.pending');
      statusColor = 'bg-yellow-100 text-yellow-700';
      progressWidth = 25;
    } else if (booking.status === 'confirmed') {
      statusLabel = t('checkoutModal.status.confirmed');
      statusColor = 'bg-green-100 text-green-700';
      progressWidth = 50;
    } else if (booking.status === 'completed') {
      statusLabel = t('checkoutModal.status.completed');
      statusColor = 'bg-teal-100 text-teal-700';
      progressWidth = 100;
    } else if (booking.status === 'cancelled') {
      statusLabel = t('checkoutModal.status.cancelled');
      statusColor = 'bg-red-100 text-red-700';
      progressWidth = 0;
    }

    if (booking.paymentStatus === 'paid') {
      paymentLabel = t('checkoutModal.paymentStatus.paid');
      paymentColor = 'bg-blue-100 text-blue-700';
      if (booking.status === 'confirmed') progressWidth = 75;
    } else if (booking.paymentStatus === 'pending') {
      paymentLabel = t('checkoutModal.paymentStatus.pending');
      paymentColor = 'bg-yellow-100 text-yellow-700';
    } else if (booking.paymentStatus === 'waiting for verification') {
      paymentLabel = t('checkoutModal.paymentStatus.waitingVerification');
      paymentColor = 'bg-orange-100 text-orange-700';
      if (booking.status === 'confirmed') progressWidth = 60;
    } else if (booking.paymentStatus === 'failed') {
      paymentLabel = t('checkoutModal.paymentStatus.failed');
      paymentColor = 'bg-red-100 text-red-700';
    } else if (booking.paymentStatus === 'expired') {
      paymentLabel = t('checkoutModal.paymentStatus.expired');
      paymentColor = 'bg-red-200 text-red-800';
    }

    return { statusLabel, statusColor, paymentLabel, paymentColor, progressWidth };
  };

  const getInvoiceDetails = (invoice) => {
    let statusLabel = t('checkoutModal.paymentStatus.na');
    let statusColor = 'bg-gray-200 text-gray-800';

    if (invoice.paymentStatus === 'paid') {
      statusLabel = t('checkoutModal.paymentStatus.paid');
      statusColor = 'bg-green-100 text-green-700';
    } else if (invoice.paymentStatus === 'pending') {
      statusLabel = t('checkoutModal.paymentStatus.pending');
      statusColor = 'bg-yellow-100 text-yellow-700';
    } else if (invoice.paymentStatus === 'overdue') {
      statusLabel = t('checkoutModal.paymentStatus.overdue');
      statusColor = 'bg-red-100 text-red-700';
    }

    return { statusLabel, statusColor };
  };

  const openConfirmModal = (message, action) => {
    setConfirmModalData({ message, action });
    setIsConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setIsConfirmModalOpen(false);
    setConfirmModalData({});
  };

  const actualCancelBooking = async (bookingId) => {
    closeConfirmModal();
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError(t('checkoutModal.errors.tokenMissing'));
        return;
      }
      const response = await axios.put(
        `${BACKEND_URL}/api/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setBookings(
        bookings.map((booking) =>
          booking._id === bookingId ? { ...booking, status: 'cancelled' } : booking,
        ),
      );
      setSuccessMessage(t('checkoutModal.success.cancelBooking'));
      setError('');
    } catch (err) {
      console.error('DashboardModal: Error cancelling booking:', err);
      setError(err.response?.data.message || t('checkoutModal.errors.cancelBookingFailed'));
    }
  };

  const handleCheckoutPayment = async (bookingId) => {
    setProcessingBookingId(bookingId);
    setError('');
    setSuccessMessage('');
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError(t('checkoutModal.errors.tokenMissing'));
        setProcessingBookingId(null);
        return;
      }
      closeModal();
      navigate(`/checkout-summary/${bookingId}`);
    } catch (err) {
      console.error('DashboardModal: Error during checkout navigation:', err);
      setError(err.response?.data.message || t('checkoutModal.errors.checkoutNavigationFailed'));
    } finally {
      setProcessingBookingId(null);
    }
  };

  const handlePrintPass = async (bookingId) => {
    setIsPrinting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        openConfirmModal(t('checkoutModal.errors.tokenMissing'), null);
        setIsPrinting(false);
        return;
      }
      const response = await axios.get(`${BACKEND_URL}/api/bookings/${bookingId}/pass`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `pass-${bookingId.slice(-9)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('DashboardModal: Error downloading pass:', err);
      const errorMessage = err.response?.data.message || t('checkoutModal.errors.downloadPassFailed');
      openConfirmModal(errorMessage, null);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrintInvoice = async (bookingId) => {
    setIsPrinting(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        openConfirmModal(t('checkoutModal.errors.tokenMissing'), null);
        setIsPrinting(false);
        return;
      }
      const response = await axios.get(`${BACKEND_URL}/api/bookings/invoice/${bookingId}`, {
        responseType: 'blob',
        headers: { Authorization: `Bearer ${token}` },
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = fileURL;
      link.setAttribute('download', `invoice-${bookingId.slice(-9)}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(fileURL);
    } catch (err) {
      console.error('DashboardModal: Error downloading invoice:', err);
      const errorMessage = err.response?.data.message || t('checkoutModal.errors.downloadInvoiceFailed');
      openConfirmModal(errorMessage, null);
    } finally {
      setIsPrinting(false);
    }
  };

  const openImageModal = (imageUrl) => {
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImage('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
        >
          <motion.div
            className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-2xl text-gray-500 transition-colors hover:text-gray-700"
              aria-label={t('checkoutModal.aria.closeDashboardModal')}
            >
              <BiX />
            </button>
            <div className="flex justify-center border-b border-gray-200 pb-4">
              <button
                className={`py-2 px-6 rounded-t-lg font-medium text-sm sm:text-base ${
                  activeTab === 'account' ? 'border-b-2 border-havanaBlue text-havanaBlue' : 'text-gray-600 hover:text-havanaBlue'
                }`}
                onClick={() => setActiveTab('account')}
              >
                {t('checkoutModal.tabs.account')}
              </button>
              <button
                className={`py-2 px-6 rounded-t-lg font-medium text-sm sm:text-base ${
                  activeTab === 'booking' ? 'border-b-2 border-havanaBlue text-havanaBlue' : 'text-gray-600 hover:text-havanaBlue'
                }`}
                onClick={() => setActiveTab('booking')}
              >
                {t('checkoutModal.tabs.booking')}
              </button>
              <button
                className={`py-2 px-6 rounded-t-lg font-medium text-sm sm:text-base ${
                  activeTab === 'invoice' ? 'border-b-2 border-havanaBlue text-havanaBlue' : 'text-gray-600 hover:text-havanaBlue'
                }`}
                onClick={() => setActiveTab('invoice')}
              >
                {t('checkoutModal.tabs.invoice')}
              </button>
            </div>

            {/* Content for "My Account" tab */}
            {activeTab === 'account' && (
              <div className="p-4 sm:p-6 text-gray-800">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">{t('checkoutModal.accountDetails')}</h3>
                <div className="space-y-3 text-sm sm:text-base">
                  <p>
                    <strong>{t('checkoutModal.email')}:</strong> {user?.email || t('checkoutModal.notSpecified')}
                  </p>
                  <p>
                    <strong>{t('checkoutModal.username')}:</strong> {user?.username || t('checkoutModal.notSpecified')}
                  </p>
                  <p>
                    <strong>{t('checkoutModal.userId')}:</strong> {user?.id || t('checkoutModal.notSpecified')}
                  </p>
                </div>
              </div>
            )}

            {/* Content for "My Orders" tab */}
            {activeTab === 'booking' && (
              <div className="p-4 sm:p-6 text-gray-800">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">{t('checkoutModal.orderList')}</h3>
                {loading ? (
                  <div className="flex items-center justify-center h-48">
                    <BiLoaderAlt className="animate-spin text-4xl text-havanaBlue" />
                  </div>
                ) : error ? (
                  <div className="text-center text-red-500 py-4">{error}</div>
                ) : (
                  <ul className="space-y-4">
                    {bookings.map((booking) => {
                      const { statusLabel, statusColor, paymentLabel, paymentColor, progressWidth } = getBookingDetails(booking);
                      const isExpanded = expandedBooking === booking._id;

                      return (
                        <li key={booking._id} className="border-b border-gray-200 pb-4">
                          <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={() => setExpandedBooking(isExpanded ? null : booking._id)}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`py-1 px-2 text-xs font-semibold rounded-full ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                <span className={`py-1 px-2 text-xs font-semibold rounded-full ${paymentColor}`}>
                                  {paymentLabel}
                                </span>
                              </div>
                              <p className="font-semibold mt-2">
                                {t('checkoutModal.orderId')}: <span className="font-normal text-sm">{booking._id}</span>
                              </p>
                            </div>
                            <button className="text-gray-500 hover:text-havanaBlue">
                              {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                            </button>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 overflow-hidden"
                              >
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                                  <div className="bg-havanaBlue h-2.5 rounded-full transition-all duration-500 ease-in-out" style={{ width: `${progressWidth}%` }}></div>
                                </div>
                                <p className="text-sm">
                                  <strong>{t('checkoutModal.orderDate')}:</strong> {new Date(booking.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-sm mt-1">
                                  <strong>{t('checkoutModal.totalPrice')}:</strong> {booking.currency} {booking.totalPrice.toLocaleString()}
                                </p>
                                {booking.paymentStatus === 'waiting for verification' && booking.paymentProofUrl && (
                                  <div className="mt-4">
                                    <p className="text-sm font-semibold">{t('paymentProof')}:</p>
                                    <img
                                      src={booking.paymentProofUrl}
                                      alt={t('checkoutModal.paymentProofAlt')}
                                      className="w-24 h-24 object-cover rounded-md cursor-pointer mt-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openImageModal(booking.paymentProofUrl);
                                      }}
                                    />
                                  </div>
                                )}
                                <ul className="mt-4 space-y-2">
                                  {/* PERBAIKAN: Item name sekarang diambil dari name yang sudah diterjemahkan oleh backend */}
                                  {booking.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="bg-gray-50 p-3 rounded-md">
                                      <p className="font-semibold text-sm">
                                        {/* Ambil item.itemId.name yang sudah diganti oleh backend */}
                                        {item.itemId.name || t('checkoutModal.unknownItem')} 
                                      </p>
                                      <p className="text-xs">
                                        {item.itemType} | {t('checkoutModal.quantity')}: {item.quantity} | {t('checkoutModal.price')}: {item.price.toLocaleString()}
                                      </p>
                                      {/* Opsi menampilkan destinasi yang juga sudah diterjemahkan */}
                                      {item.itemId.destinations && item.itemId.destinations.length > 0 && (
                                          <p className="text-xs mt-1 text-gray-500">
                                              {t('checkoutModal.destination')}: {item.itemId.destinations.map(d => d.name).join(', ')}
                                          </p>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                                  {booking.status === 'confirmed' && booking.paymentStatus === 'pending' && (
                                    <button
                                      onClick={() => handleCheckoutPayment(booking._id)}
                                      disabled={processingBookingId === booking._id}
                                      className="flex-grow rounded-md bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-green-600 disabled:bg-gray-400"
                                    >
                                      {processingBookingId === booking._id ? (
                                        <div className="flex items-center justify-center">
                                          <BiLoaderAlt className="animate-spin mr-2" />
                                          {t('checkoutModal.processing')}
                                        </div>
                                      ) : (
                                        t('checkoutModal.payNow')
                                      )}
                                    </button>
                                  )}
                                  {booking.status === 'completed' && (
                                    <button
                                      onClick={() => handlePrintPass(booking._id)}
                                      disabled={isPrinting}
                                      className="flex-grow rounded-md bg-purple-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-purple-600 disabled:bg-gray-400"
                                    >
                                      {isPrinting ? (
                                        <div className="flex items-center justify-center">
                                          <BiLoaderAlt className="animate-spin mr-2" />
                                          {t('checkoutModal.printing')}
                                        </div>
                                      ) : (
                                        <>
                                          <BiPrinter className="inline-block mr-2" />
                                          {t('checkoutModal.printPass')}
                                        </>
                                      )}
                                    </button>
                                  )}
                                  {booking.status === 'pending' && booking.paymentStatus === 'pending' && (
                                    <button
                                      onClick={() =>
                                        openConfirmModal(
                                          t('checkoutModal.confirmCancelOrder'),
                                          () => actualCancelBooking(booking._id),
                                        )
                                      }
                                      className="flex-grow rounded-md bg-red-500 px-4 py-2 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-red-600"
                                    >
                                      {t('checkoutModal.cancelOrder')}
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                )}
                {successMessage && <div className="text-center text-green-500 py-4">{successMessage}</div>}
              </div>
            )}

            {/* Content for "Invoices" tab */}
            {activeTab === 'invoice' && (
              <div className="p-4 sm:p-6 text-gray-800">
                <h3 className="text-xl sm:text-2xl font-bold mb-4">{t('checkoutModal.invoiceList')}</h3>
                {invoicesLoading ? (
                  <div className="flex items-center justify-center h-48">
                    <BiLoaderAlt className="animate-spin text-4xl text-havanaBlue" />
                  </div>
                ) : invoicesError ? (
                  <div className="text-center text-red-500 py-4">{invoicesError}</div>
                ) : (
                  <ul className="space-y-4">
                    {invoices.map((invoice) => {
                      const { statusLabel, statusColor } = getInvoiceDetails(invoice);
                      const isExpanded = expandedInvoice === invoice._id;

                      return (
                        <li key={invoice._id} className="border-b border-gray-200 pb-4">
                          <div
                            className="flex cursor-pointer items-center justify-between"
                            onClick={() => setExpandedInvoice(isExpanded ? null : invoice._id)}
                          >
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className={`py-1 px-2 text-xs font-semibold rounded-full ${statusColor}`}>
                                  {statusLabel}
                                </span>
                              </div>
                              <p className="font-semibold mt-2">
                                {t('checkoutModal.invoiceId')}: <span className="font-normal text-sm">{invoice._id}</span>
                              </p>
                            </div>
                            <button className="text-gray-500 hover:text-havanaBlue">
                              {isExpanded ? <BiChevronUp /> : <BiChevronDown />}
                            </button>
                          </div>
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-4 overflow-hidden"
                              >
                                <p className="text-sm">
                                  <strong>{t('checkoutModal.totalPrice')}:</strong> {invoice.currency} {invoice.totalPrice.toLocaleString()}
                                </p>
                                <ul className="mt-4 space-y-2">
                                  {/* PERBAIKAN: Item name sekarang diambil dari name yang sudah diterjemahkan oleh backend */}
                                  {invoice.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className="bg-gray-50 p-3 rounded-md">
                                      <p className="font-semibold text-sm">
                                        {/* Ambil item.itemId.name yang sudah diganti oleh backend */}
                                        {item.itemId.name || t('checkoutModal.unknownItem')}
                                      </p>
                                      <p className="text-xs">
                                        {item.itemType} | {t('checkoutModal.quantity')}: {item.quantity} | {t('checkoutModal.price')}: {item.price.toLocaleString()}
                                      </p>
                                       {/* Opsi menampilkan destinasi yang juga sudah diterjemahkan */}
                                       {item.itemId.destinations && item.itemId.destinations.length > 0 && (
                                          <p className="text-xs mt-1 text-gray-500">
                                              {t('checkoutModal.destination')}: {item.itemId.destinations.map(d => d.name).join(', ')}
                                          </p>
                                      )}
                                    </li>
                                  ))}
                                </ul>
                                <div className="mt-4 flex justify-center">
                                  <button
                                    onClick={() => handlePrintInvoice(invoice._id)}
                                    disabled={isPrinting}
                                    className="h-10 rounded-md bg-havanaBlue px-3 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-blue-700 sm:px-4 sm:text-base disabled:bg-gray-400"
                                  >
                                    {isPrinting ? (
                                      <div className="flex items-center">
                                        <BiLoaderAlt className="animate-spin mr-2" />
                                        {t('checkoutModal.printing')}
                                      </div>
                                    ) : (
                                      t('checkoutModal.printInvoice')
                                    )}
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end sm:mt-6">
              <button
                type="button"
                onClick={closeModal}
                className="h-10 rounded-md bg-havanaBlue px-3 text-sm font-medium text-white shadow-md transition-colors duration-200 hover:bg-blue-700 sm:px-4 sm:text-base"
              >
                {t('checkoutModal.close')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      <CustomModal
        isOpen={isConfirmModalOpen}
        title={confirmModalData.message ? t('checkoutModal.confirmAction') : ''}
        message={confirmModalData.message || ''}
        onConfirm={confirmModalData.action}
        onCancel={closeConfirmModal}
      />
      <ImageModal
        isOpen={isImageModalOpen}
        imageUrl={selectedImage}
        onClose={closeImageModal}
      />
    </AnimatePresence>
  );
}

export default DashboardModal;