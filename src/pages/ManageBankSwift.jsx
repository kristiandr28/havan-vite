import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiPlus, BiEdit, BiTrash, BiX, BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants } from '../components/partials/modalVariants'; // Adjust path if needed

function ManageBankSwift() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [banks, setBanks] = useState([]);
  const [currencies, setCurrencies] = useState([]); // State baru untuk mata uang
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true); // State untuk loading mata uang

  // State for Add/Edit Bank Form Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentBank, setCurrentBank] = useState({
    _id: '',
    bankName: '',
    swiftCode: '',
    bankAddress: '',
    accountNumber: '',
    accountName: '',
    beneficiaryAddress: '',
    intermediaryBank: '',
    currency: '', // Ini akan menyimpan ID mata uang jika diedit, atau kode jika dibuat baru
    notes: '',
  });

  // State for Delete Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [bankToDelete, setBankToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  // --- Fetch Data Functions ---
  const fetchBanks = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/bankswiftcodes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setBanks(response.data);
    } catch (err) {
      setError('Failed to fetch bank data');
      console.error('Fetch bank data error:', err.response?.data?.message || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, handleLogout]);

  const fetchCurrencies = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/currencies`);
      setCurrencies(response.data);
      setLoadingCurrencies(false);
    } catch (err) {
      setError('Failed to fetch currencies');
      console.error('Fetch currency error:', err.response?.data?.message || err.message);
      setLoadingCurrencies(false);
    }
  }, [BACKEND_URL]);


  // --- Auth, Authorization, and Data Fetching (useEffect) ---
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

    fetchBanks();
    fetchCurrencies();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken, fetchBanks, fetchCurrencies]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // --- Add/Edit Form Modal ---
  const openFormModal = useCallback((bank = null) => {
    if (bank) {
      setIsEdit(true);
      // Untuk edit, currency yang diterima adalah objek, kita ambil code-nya
      setCurrentBank({ ...bank, currency: bank.currency.code });
    } else {
      setIsEdit(false);
      setCurrentBank({
        _id: '',
        bankName: '',
        swiftCode: '',
        bankAddress: '',
        accountNumber: '',
        accountName: '',
        beneficiaryAddress: '',
        intermediaryBank: '',
        currency: '',
        notes: '',
      });
    }
    setFormModalOpen(true);
    setError('');
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    setError('');
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentBank((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const requiredFields = ['bankName', 'swiftCode', 'bankAddress', 'accountNumber', 'accountName', 'beneficiaryAddress', 'currency'];
    for (const field of requiredFields) {
      if (!currentBank[field]) {
        setError(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required.`);
        return;
      }
    }

    // Ubah nama field untuk POST/PUT request
    const payload = {
      ...currentBank,
      currencyCode: currentBank.currency, // Mengirimkan kode mata uang, bukan ID
    };
    delete payload.currency;

    try {
      if (isEdit) {
        // Endpoint PUT perlu ID
        const response = await axios.put(
          `${BACKEND_URL}/api/bankswiftcodes/${currentBank._id}`,
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        // Perbarui state banks dengan data yang baru dari respons server
        setBanks(
          banks.map((bank) => (bank._id === currentBank._id ? response.data : bank))
        );
      } else {
        const response = await axios.post(`${BACKEND_URL}/api/bankswiftcodes`, payload, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setBanks([...banks, response.data]);
      }
      closeFormModal();
      setError('');
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save bank record');
      console.error('Submit error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [isEdit, currentBank, BACKEND_URL, authToken, banks, closeFormModal, handleLogout]);

  const handleSetActive = useCallback(async (bankId) => {
    try {
      await axios.put(`${BACKEND_URL}/api/bankswiftcodes/${bankId}/activate`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchBanks(); // reload supaya status active langsung update
    } catch (err) {
      setError(err.response?.data.message || 'Failed to set bank active');
      console.error('Set active error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, fetchBanks, handleLogout]);


  // --- Delete Confirmation Modal ---
  const openConfirmModal = useCallback((bank) => {
    setBankToDelete(bank);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setBankToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!bankToDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/bankswiftcodes/${bankToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setBanks(banks.filter((bank) => bank._id !== bankToDelete._id));
      closeConfirmModal();
      setError('');
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete bank record');
      console.error('Delete error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      closeConfirmModal();
    }
  }, [bankToDelete, BACKEND_URL, authToken, banks, closeConfirmModal, handleLogout]);

  // --- Render Loading State ---
  if (!isAuthReady || loadingCurrencies) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Loading authentication and data...</p>
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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Bank Swift Data</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Bank
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bank Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Swift Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Currency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {banks.length === 0 && !error ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No bank swift data found.
                      </td>
                    </tr>
                  ) : (
                    banks.map((bank) => (
                      <tr key={bank._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.bankName}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.swiftCode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{bank.accountNumber}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bank.currency ? `${bank.currency.code} - ${bank.currency.name}` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bank.isActive ? (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Active</span>
                          ) : (
                            <button
                              onClick={() => handleSetActive(bank._id)}
                              className="text-blue-500 hover:text-blue-700 text-xs"
                            >
                              Set Active
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(bank)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit bank record for ${bank.bankName}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(bank)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete bank record for ${bank.bankName}`}
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

        {/* Modal for Add/Edit Bank */}
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
                  className="relative bg-white rounded-lg p-6 w-full max-w-lg shadow-xl"
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
                    {isEdit ? 'Edit Bank Record' : 'Add New Bank'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <input type="text" id="bankName" name="bankName" value={currentBank.bankName} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="swiftCode" className="block text-sm font-medium text-gray-700">Swift Code</label>
                        <input type="text" id="swiftCode" name="swiftCode" value={currentBank.swiftCode} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="bankAddress" className="block text-sm font-medium text-gray-700">Bank Address</label>
                        <input type="text" id="bankAddress" name="bankAddress" value={currentBank.bankAddress} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">Account Number</label>
                        <input type="text" id="accountNumber" name="accountNumber" value={currentBank.accountNumber} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">Account Name</label>
                        <input type="text" id="accountName" name="accountName" value={currentBank.accountName} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="beneficiaryAddress" className="block text-sm font-medium text-gray-700">Beneficiary Address</label>
                        <input type="text" id="beneficiaryAddress" name="beneficiaryAddress" value={currentBank.beneficiaryAddress} onChange={handleInputChange} required className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="intermediaryBank" className="block text-sm font-medium text-gray-700">Intermediary Bank (Optional)</label>
                        <input type="text" id="intermediaryBank" name="intermediaryBank" value={currentBank.intermediaryBank} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">Currency</label>
                        <select
                          id="currency"
                          name="currency"
                          value={currentBank.currency}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                          required
                        >
                          <option value="">-- Select Currency --</option>
                          {currencies.map((curr) => (
                            <option key={curr._id} value={curr.code}>
                              {curr.code} - {curr.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes (Optional)</label>
                        <textarea id="notes" name="notes" rows="3" value={currentBank.notes} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm" />
                      </div>
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

        {/* Delete Confirmation Modal */}
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
                  <h3 className="text-xl font-semibold text-red-600 mb-4">Confirm Deletion</h3>
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete the bank record for <strong>{bankToDelete?.bankName}</strong>? This action cannot be undone.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={closeConfirmModal}
                      className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                      Delete
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

export default ManageBankSwift;