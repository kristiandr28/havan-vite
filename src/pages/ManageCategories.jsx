import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiPlus, BiEdit, BiTrash, BiX, BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Impor komponen modal baru
import CategoryFormModal from './category/CategoryFormModal'; // Ganti path sesuai struktur Anda

const modalVariants = {
  hidden: { y: "-100vh", opacity: 0 },
  visible: { y: "0", opacity: 1, transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 } },
  exit: { y: "100vh", opacity: 0 },
};

function ManageCategories() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]); // State untuk bahasa
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk modal Add/Edit Category
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  // Current category akan memuat semua terjemahan saat edit
  const [currentCategory, setCurrentCategory] = useState({ 
    _id: '', 
    translations: [] // Gunakan translations
  }); 

  // State untuk modal konfirmasi Delete
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  // --- Utility: Handle API Error ---
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

  // --- Fetch Languages Function ---
  const fetchLanguages = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/languages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLanguages(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to load languages. Cannot create or edit categories.');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  // --- Fetch Data Function (Diambil dengan bahasa default, misal 'en') ---
  const fetchCategories = useCallback(async () => {
    try {
      // Endpoint categories harus mendukung pengambilan data multibahasa (misal dengan query param lang)
      // Kita ambil dengan lang=en (atau default), dan backend merespons dengan properti 'name'
      // yang sudah diterjemahkan atau default.
      const response = await axios.get(`${BACKEND_URL}/api/categories?lang=en`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setCategories(response.data);
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to fetch categories');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  // --- Autentikasi, Otorisasi, dan Pengambilan Data Awal (useEffect) ---
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

    fetchLanguages(); // Ambil bahasa
    fetchCategories(); // Ambil kategori
  }, [isAuthenticated, user, isAuthReady, navigate, fetchCategories, fetchLanguages]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, []);

  // --- Modal Add/Edit Category ---
  const openFormModal = useCallback(async (category = null) => {
    setError('');
    if (languages.length === 0) {
      setError('Language data not loaded. Please try again.');
      return;
    }

    if (category) {
      setIsEdit(true);
      try {
        // Ambil detail kategori LENGKAP dengan SEMUA terjemahan
        const response = await axios.get(`${BACKEND_URL}/api/categories/${category._id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        setCurrentCategory(response.data);
      } catch (err) {
        handleApiError(err, 'Failed to load category details for editing.');
        return;
      }
    } else {
      setIsEdit(false);
      // Inisialisasi terjemahan kosong untuk setiap bahasa
      const initialTranslations = languages.map(lang => ({
        language: lang._id,
        name: '',
      }));
      setCurrentCategory({ _id: '', translations: initialTranslations });
    }
    setFormModalOpen(true);
  }, [BACKEND_URL, authToken, languages, handleApiError]);


  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    setError('');
    setCurrentCategory({ _id: '', translations: [] }); // Reset state
  }, []);

  // Catatan: handleSubmit dipindahkan ke CategoryFormModal
  // karena modal sekarang menjadi komponen yang terpisah.
  // Namun, fetchCategories akan dipanggil dari CategoryFormModal 
  // setelah berhasil menyimpan/mengedit.

  // --- Modal Konfirmasi Delete ---
  const openConfirmModal = useCallback((category) => {
    // category.name di sini adalah nama dalam bahasa default (misal EN)
    setCategoryToDelete(category);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setCategoryToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/categories/${categoryToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setCategories(categories.filter((cat) => cat._id !== categoryToDelete._id));
      closeConfirmModal();
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to delete category');
      closeConfirmModal();
    }
  }, [categoryToDelete, BACKEND_URL, authToken, categories, closeConfirmModal, handleApiError]);

  // --- Render Loading State ---
  // Tunggu hingga bahasa dimuat sebelum mengizinkan penambahan/pengeditan
  if (!isAuthReady || languages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Memuat data dan bahasa...</p>
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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Categories (Multilingual)</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Category
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name (EN/Default)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.length === 0 && !error ? (
                    <tr>
                      <td colSpan="2" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No categories found.
                      </td>
                    </tr>
                  ) : (
                    categories.map((category) => (
                      <tr key={category._id}>
                        {/* Asumsi category.name adalah nama dalam bahasa default (misal EN) */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {category.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(category)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit category ${category.name}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(category)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete category ${category.name}`}
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

        {/* Modal untuk Add/Edit Category - Menggunakan Komponen Terpisah */}
        <CategoryFormModal
          isOpen={formModalOpen}
          onClose={closeFormModal}
          isEdit={isEdit}
          currentCategory={currentCategory}
          setCurrentCategory={setCurrentCategory}
          languages={languages}
          BACKEND_URL={BACKEND_URL}
          authToken={authToken}
          fetchCategories={fetchCategories}
          handleApiError={handleApiError} // Teruskan handleApiError
        />


        {/* Modal Konfirmasi Delete (tetap di sini) */}
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
                    Apakah Anda yakin ingin menghapus kategori <strong>{categoryToDelete?.name}</strong>?
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

export default ManageCategories;