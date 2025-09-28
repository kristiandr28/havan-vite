import React, { useEffect, useState, useCallback } from 'react'; // Tambahkan useCallback
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
// Hapus jwtDecode karena kita akan menggunakan user dari useAuth
// import { jwtDecode } from 'jwt-decode';
import { BiPlus, BiEdit, BiTrash, BiX, BiLoaderAlt } from 'react-icons/bi'; // Tambahkan BiX dan BiLoaderAlt
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth'; // Import useAuth
import { createPortal } from 'react-dom'; // Untuk modal kustom
import { motion, AnimatePresence } from 'framer-motion'; // Untuk animasi modal
import { modalVariants } from '../components/partials/modalVariants'; // Pastikan path benar

function ManageCurrencies() {
  // Ambil state dan fungsi auth dari useAuth
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [currencies, setCurrencies] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk modal Add/Edit Currency
  const [formModalOpen, setFormModalOpen] = useState(false); // Ganti nama agar tidak bentrok
  const [isEdit, setIsEdit] = useState(false);
  const [currentCurrency, setCurrentCurrency] = useState({
    _id: '',
    name: '',
    code: '',
    symbol: '',
    isActive: false,
  });

  // State untuk modal konfirmasi Delete
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL; // Gunakan env variable

  // --- Fetch Data Function (Dideklarasikan sebelum useEffect) ---
  const fetchCurrencies = useCallback(async () => {
    try {
      // Gunakan authToken dari useAuth
      const response = await axios.get(`${BACKEND_URL}/api/currencies`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setCurrencies(response.data);
    } catch (err) {
      setError('Failed to fetch currencies');
      console.error('Fetch currencies error:', err.response?.data?.message || err.message);
      // Jika error 401/403, mungkin token tidak valid, lakukan logout
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, handleLogout]); // Tambahkan authToken dan handleLogout ke dependencies

  // --- Autentikasi dan Otorisasi (useEffect) ---
  useEffect(() => {
    // Tunggu sampai isAuthReady menjadi true
    if (!isAuthReady) {
      return; // Jangan lakukan apa-apa sampai auth siap
    }

    if (!isAuthenticated) {
      navigate('/login'); // Redirect ke login jika tidak terautentikasi
      return;
    }

    if (user?.role !== 'admin') { // Gunakan user dari useAuth
      navigate('/'); // Redirect ke home jika bukan admin
      return;
    }

    fetchCurrencies();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken, fetchCurrencies]); // Tambahkan fetchCurrencies ke dependencies

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, []);

  // --- Modal Add/Edit Currency ---
  const openFormModal = useCallback((currency = null) => {
    if (currency) {
      setIsEdit(true);
      setCurrentCurrency(currency);
    } else {
      setIsEdit(false);
      setCurrentCurrency({ _id: '', name: '', code: '', symbol: '', isActive: false });
    }
    setFormModalOpen(true); // Menggunakan setFormModalOpen
    setError(''); // Clear form-specific errors
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false); // Menggunakan setFormModalOpen
    setError('');
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentCurrency((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleToggleActive = useCallback(async (currencyId, isActive) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/currencies/${currencyId}`,
        { isActive: !isActive },
        { headers: { Authorization: `Bearer ${authToken}` } } // Gunakan authToken
      );
      setCurrencies(
        currencies.map((cur) =>
          cur._id === currencyId ? response.data : { ...cur, isActive: false }
        )
      );
      setError(''); // Clear error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to toggle currency status');
      console.error('Toggle active error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, currencies, handleLogout]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Basic validation
    if (!currentCurrency.name || !currentCurrency.code || !currentCurrency.symbol) {
      setError('Name, Code, and Symbol are required.');
      return;
    }

    try {
      if (isEdit) {
        const response = await axios.put(
          `${BACKEND_URL}/api/currencies/${currentCurrency._id}`,
          currentCurrency,
          { headers: { Authorization: `Bearer ${authToken}` } } // Gunakan authToken
        );
        setCurrencies(
          currencies.map((cur) =>
            cur._id === currentCurrency._id
              ? response.data
              : currentCurrency.isActive && response.data.isActive // Jika yang diedit menjadi aktif, nonaktifkan yang lain
              ? { ...cur, isActive: false }
              : cur
          )
        );
      } else {
        const response = await axios.post(
          `${BACKEND_URL}/api/currencies`,
          currentCurrency,
          { headers: { Authorization: `Bearer ${authToken}` } } // Gunakan authToken
        );
        setCurrencies(
          currentCurrency.isActive
            ? [
                ...currencies.map((cur) => ({ ...cur, isActive: false })), // Nonaktifkan semua jika yang baru aktif
                response.data,
              ]
            : [...currencies, response.data]
        );
      }
      closeFormModal();
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save currency');
      console.error('Submit error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [isEdit, currentCurrency, BACKEND_URL, authToken, currencies, closeFormModal, handleLogout]);

  // --- Modal Konfirmasi Delete ---
  const openConfirmModal = useCallback((currency) => {
    setCurrencyToDelete(currency);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setCurrencyToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!currencyToDelete) return; // Pastikan ada mata uang yang akan dihapus

    try {
      await axios.delete(`${BACKEND_URL}/api/currencies/${currencyToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }, // Gunakan authToken
      });
      setCurrencies(currencies.filter((cur) => cur._id !== currencyToDelete._id));
      closeConfirmModal(); // Tutup modal setelah berhasil
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete currency');
      console.error('Delete error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      closeConfirmModal(); // Tetap tutup modal meskipun ada error
    }
  }, [currencyToDelete, BACKEND_URL, authToken, currencies, closeConfirmModal, handleLogout]);

  // --- Render Loading State ---
  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Memuat autentikasi...</p>
      </div>
    );
  }

  // --- Render Component ---
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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Currencies</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Currency
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currencies.length === 0 && !error ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No currencies found.
                      </td>
                    </tr>
                  ) : (
                    currencies.map((currency) => (
                      <tr key={currency._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {currency.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {currency.code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {currency.symbol}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => handleToggleActive(currency._id, currency.isActive)}
                            className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
                              currency.isActive ? 'bg-havanaBlue' : 'bg-gray-300'
                            }`}
                            aria-label={currency.isActive ? 'Deactivate currency' : 'Activate currency'}
                          >
                            <span
                              className={`absolute left-0 inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                                currency.isActive ? 'translate-x-6' : 'translate-x-1'
                              }`}
                            />
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(currency)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit currency ${currency.name}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(currency)} // Membuka modal konfirmasi
                            className={`text-red-500 hover:text-red-700 transition ${currency.isActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={currency.isActive} // Tidak bisa dihapus jika aktif
                            aria-label={`Delete currency ${currency.name}`}
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

        {/* Modal untuk Add/Edit Currency */}
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
                    {isEdit ? 'Edit Currency' : 'Add Currency'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="currencyName" className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        id="currencyName"
                        name="name"
                        value={currentCurrency.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="currencyCode" className="block text-sm font-medium text-gray-700">Code</label>
                      <input
                        type="text"
                        id="currencyCode"
                        name="code"
                        value={currentCurrency.code}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="currencySymbol" className="block text-sm font-medium text-gray-700">Symbol</label>
                      <input
                        type="text"
                        id="currencySymbol"
                        name="symbol"
                        value={currentCurrency.symbol}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="currencyIsActive" className="block text-sm font-medium text-gray-700">Active Status</label>
                      <input
                        type="checkbox"
                        id="currencyIsActive"
                        name="isActive"
                        checked={currentCurrency.isActive}
                        onChange={(e) =>
                          setCurrentCurrency((prev) => ({
                            ...prev,
                            isActive: e.target.checked,
                          }))
                        }
                        className="mt-1 h-4 w-4 text-havanaBlue focus:ring-havanaBlue border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-600">
                        {currentCurrency.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <button
                        type="button"
                        onClick={closeFormModal}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                      >
                        Cancel
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
                    Apakah Anda yakin ingin menghapus mata uang <strong>{currencyToDelete?.name} ({currencyToDelete?.code})</strong>?
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

export default ManageCurrencies;
