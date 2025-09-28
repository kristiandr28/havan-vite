import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BiPlus, BiEdit, BiTrash, BiX, BiLoaderAlt } from 'react-icons/bi';
import { format } from 'date-fns';

// Variants untuk animasi modal
const modalVariants = {
  hidden: {
    y: "-100vh",
    opacity: 0
  },
  visible: {
    y: "0",
    opacity: 1,
    transition: {
      duration: 0.1,
      type: "spring",
      damping: 25,
      stiffness: 500
    }
  },
  exit: {
    y: "100vh",
    opacity: 0
  }
};

function ManageVouchers() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [vouchers, setVouchers] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk modal Add/Edit Voucher
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentVoucher, setCurrentVoucher] = useState({
    _id: '',
    code: '',
    discountType: 'fixed',
    // Menggunakan satu field untuk nilai diskon di frontend
    // dan memetakannya ke field yang benar di backend saat submit
    discountValue: 0,
    validUntil: '' // Nama field yang lebih ramah pengguna untuk date picker
  });

  // State untuk modal konfirmasi Delete
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  // --- Autentikasi dan Otorisasi ---
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

    fetchVouchers();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken]);

  const fetchVouchers = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/vouchers`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setVouchers(response.data);
    } catch (err) {
      setError('Failed to fetch vouchers');
      console.error('Fetch vouchers error:', err.response?.data?.message || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, handleLogout]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // --- Modal Add/Edit Voucher ---
  const openFormModal = useCallback((voucher = null) => {
    if (voucher) {
      setIsEdit(true);
      setCurrentVoucher({
        _id: voucher._id,
        code: voucher.code,
        discountType: voucher.discountType,
        // Sesuaikan nama field dari backend ke nama field frontend
        discountValue: voucher.discountType === 'fixed' ? voucher.discountAmount : voucher.discountPercentage,
        validUntil: format(new Date(voucher.expirationDate), 'yyyy-MM-dd')
      });
    } else {
      setIsEdit(false);
      setCurrentVoucher({
        _id: '',
        code: '',
        discountType: 'fixed',
        discountValue: 0,
        validUntil: ''
      });
    }
    setFormModalOpen(true);
    setError('');
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    setError('');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentVoucher((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = useCallback(() => {
    if (!currentVoucher.code)
      return 'Voucher code is required';
    if (!currentVoucher.discountType)
      return 'Discount type is required';
    if (currentVoucher.discountValue <= 0)
      return 'Discount value must be greater than 0';
    if (!currentVoucher.validUntil)
      return 'Valid until date is required';
    return null;
  }, [currentVoucher]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    // Buat objek data yang sesuai dengan skema backend
    const data = {
      code: currentVoucher.code,
      discountType: currentVoucher.discountType,
      expirationDate: new Date(currentVoucher.validUntil) // Kirim sebagai expirationDate
    };

    if (currentVoucher.discountType === 'fixed') {
      data.discountAmount = Number(currentVoucher.discountValue);
    } else {
      data.discountPercentage = Number(currentVoucher.discountValue);
    }

    try {
      if (isEdit) {
        await axios.put(
          `${BACKEND_URL}/api/vouchers/${currentVoucher._id}`,
          data,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
      } else {
        await axios.post(`${BACKEND_URL}/api/vouchers`, data, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
      }
      closeFormModal();
      // Panggil fetchVouchers untuk memuat ulang data terbaru
      await fetchVouchers();
    } catch (err) {
      const backendMessage = err.response?.data.message;
      if (backendMessage && backendMessage.includes('validation failed')) {
        setError('Pastikan semua field terisi dengan benar. Nilai diskon dan tanggal kedaluwarsa harus ada.');
      } else {
        setError(backendMessage || 'Failed to save voucher');
      }
      console.error('Save voucher error:', backendMessage || err.message);
    }
  }, [isEdit, currentVoucher, validateForm, BACKEND_URL, authToken, closeFormModal, fetchVouchers]);

  // --- Modal Konfirmasi Delete ---
  const openConfirmModal = useCallback((voucher) => {
    setVoucherToDelete(voucher);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setVoucherToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!voucherToDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/vouchers/${voucherToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      closeConfirmModal();
      await fetchVouchers();
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete voucher');
      console.error('Delete voucher error:', err.response?.data?.message || err.message);
      closeConfirmModal();
    }
  }, [voucherToDelete, BACKEND_URL, authToken, closeConfirmModal, fetchVouchers]);

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Memuat autentikasi...</p>
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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Vouchers</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Voucher
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipe Diskon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nilai Diskon
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Berlaku Sampai
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {vouchers.length === 0 && !error ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        Tidak ada voucher ditemukan.
                      </td>
                    </tr>
                  ) : (
                    vouchers.map((voucher) => (
                      <tr key={voucher._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {voucher.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {voucher.discountType === 'fixed' ? 'Fixed Amount' : 'Percentage'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {/* Sesuaikan tampilan nilai diskon berdasarkan tipe */}
                          {voucher.discountType === 'fixed' ? voucher.discountAmount : voucher.discountPercentage}
                          {voucher.discountType === 'percentage' && '%'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(voucher.expirationDate), 'dd MMMM yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(voucher)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit voucher ${voucher.code}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(voucher)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete voucher ${voucher.code}`}
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

        {/* Modal untuk Add/Edit Voucher */}
        {formModalOpen &&
          createPortal(
            <AnimatePresence>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative bg-white rounded-lg p-6 w-full max-w-md shadow-xl"
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button
                    onClick={closeFormModal}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close form modal"
                  >
                    <BiX className="text-2xl" />
                  </button>
                  <h3 className="text-lg font-semibold text-havanaGray mb-4">
                    {isEdit ? 'Edit Voucher' : 'Add Voucher'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="code" className="block text-sm font-medium text-gray-700">Kode Voucher</label>
                      <input
                        type="text"
                        id="code"
                        name="code"
                        value={currentVoucher.code}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                        disabled={isEdit}
                      />
                    </div>
                    <div>
                      <label htmlFor="discountType" className="block text-sm font-medium text-gray-700">Tipe Diskon</label>
                      <select
                        id="discountType"
                        name="discountType"
                        value={currentVoucher.discountType}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      >
                        <option value="fixed">Fixed Amount</option>
                        <option value="percentage">Percentage</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="discountValue" className="block text-sm font-medium text-gray-700">Nilai Diskon</label>
                      <input
                        type="number"
                        id="discountValue"
                        name="discountValue"
                        value={currentVoucher.discountValue}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="validUntil" className="block text-sm font-medium text-gray-700">Berlaku Sampai</label>
                      <input
                        type="date"
                        id="validUntil"
                        name="validUntil"
                        value={currentVoucher.validUntil}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <button
                        type="button"
                        onClick={closeFormModal}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 transition"
                      >
                        {isEdit ? 'Update' : 'Create'}
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
                  variants={modalVariants}
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
                    Apakah Anda yakin ingin menghapus voucher <strong>{voucherToDelete?.code}</strong>?
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
      </div>
    </div>
  );
}

export default ManageVouchers;
