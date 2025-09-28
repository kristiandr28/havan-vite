import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiPlus, BiEdit, BiTrash, BiX, BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Import the new modal component
import IncludedFormModal from './include/IncludedFormModal'; 

const modalVariants = {
  hidden: { y: "-100vh", opacity: 0 },
  visible: { y: "0", opacity: 1, transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 } },
  exit: { y: "100vh", opacity: 0 },
};

function ManageIncluded() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [includedItems, setIncludedItems] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for Add/Edit Included Item Modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentItem, setCurrentItem] = useState({ _id: '', translations: [] });

  // State for Delete Confirmation Modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const handleApiError = useCallback((err, defaultMessage) => {
    let errorMessage = defaultMessage;
    if (err.response) {
      errorMessage = err.response.data.message || `Error ${err.response.status}`;
      if (err.response.status === 401 || err.response.status === 403) {
        handleLogout();
      }
    } else if (err.request) {
      errorMessage = 'No response from server. Check if backend is running.';
    } else {
      errorMessage = err.message;
    }
    setError(errorMessage);
    console.error('API Error:', err);
  }, [handleLogout]);

  const fetchLanguages = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/languages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLanguages(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to load languages. Cannot create or edit items.');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  const fetchIncludedItems = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/included?lang=en`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setIncludedItems(response.data);
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to fetch included items.');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  useEffect(() => {
    if (!isAuthReady) return;

    if (!isAuthenticated || user?.role !== 'admin') {
      navigate(isAuthenticated ? '/' : '/login');
      return;
    }

    fetchLanguages();
    fetchIncludedItems();
  }, [isAuthenticated, user, isAuthReady, navigate, fetchIncludedItems, fetchLanguages]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  const openFormModal = useCallback(async (item = null) => {
    setError('');
    if (item) {
      setIsEdit(true);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/included/${item._id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setCurrentItem(response.data);
      } catch (err) {
        handleApiError(err, 'Failed to load item details for editing.');
        return;
      }
    } else {
      setIsEdit(false);
      const initialTranslations = languages.map(lang => ({
        language: lang._id,
        name: '',
        description: '',
      }));
      setCurrentItem({ _id: '', translations: initialTranslations });
    }
    setFormModalOpen(true);
  }, [BACKEND_URL, authToken, languages, handleApiError]);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    setError('');
    setCurrentItem({ _id: '', translations: [] });
  }, []);

  const openConfirmModal = useCallback((item) => {
    setItemToDelete(item);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setItemToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!itemToDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/included/${itemToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setIncludedItems(includedItems.filter((item) => item._id !== itemToDelete._id));
      closeConfirmModal();
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to delete included item.');
      closeConfirmModal();
    }
  }, [itemToDelete, BACKEND_URL, authToken, includedItems, closeConfirmModal, handleApiError]);

  if (!isAuthReady || languages.length === 0) {
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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Included Items</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Included Item
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
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {includedItems.length === 0 && !error ? (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No included items found.
                      </td>
                    </tr>
                  ) : (
                    includedItems.map((item) => (
                      <tr key={item._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.description || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(item)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit included item ${item.name}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(item)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete included item ${item.name}`}
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

        {/* Render the new modal component */}
        <IncludedFormModal
          isOpen={formModalOpen}
          onClose={closeFormModal}
          isEdit={isEdit}
          currentItem={currentItem}
          setCurrentItem={setCurrentItem}
          languages={languages}
          BACKEND_URL={BACKEND_URL}
          authToken={authToken}
          fetchIncludedItems={fetchIncludedItems}
          handleApiError={handleApiError}
        />

        {/* Modal Konfirmasi Delete (tetap di sini karena ini terkait dengan state di komponen utama) */}
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
                    Apakah Anda yakin ingin menghapus item yang disertakan <strong>{itemToDelete?.name}</strong>?
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

export default ManageIncluded;