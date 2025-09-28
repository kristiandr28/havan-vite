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

function ManageSpeakingGuides() {
  // Ambil state dan fungsi auth dari useAuth
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [guides, setGuides] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk modal Add/Edit Speaking Guide
  const [formModalOpen, setFormModalOpen] = useState(false); // Ganti nama agar tidak bentrok
  const [isEdit, setIsEdit] = useState(false);
  const [currentGuide, setCurrentGuide] = useState({
    _id: '',
    name: '',
    description: '',
    price: 200000,
    image: '', // Ini akan menyimpan URL gambar
    language: [],
  });

  // State untuk modal konfirmasi Delete
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [guideToDelete, setGuideToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL; // Gunakan env variable

  // --- Fetch Data Function (Dideklarasikan sebelum useEffect) ---
  const fetchGuides = useCallback(async () => {
    try {
      // Gunakan authToken dari useAuth
      if (!authToken) { // Pastikan authToken tersedia sebelum fetch
        setError('Authentication token missing. Please log in again.');
        return;
      }

      const response = await axios.get(`${BACKEND_URL}/api/speaking-guides`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setGuides(response.data);
    } catch (err) {
      let errorMessage = 'Failed to fetch speaking guides';
      if (err.response) {
        errorMessage = err.response.data.message || `Error ${err.response.status}`;
        // Jika error 401/403, mungkin token tidak valid, lakukan logout
        if (err.response.status === 401 || err.response.status === 403) {
          handleLogout();
        }
      } else if (err.request) {
        errorMessage = 'No response from server. Check if backend is running.';
      } else {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Fetch speaking guides error:', err);
      console.error('Error details:', err.response?.data, err.response?.status);
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

    fetchGuides();
  }, [isAuthenticated, user, isAuthReady, navigate, fetchGuides]); // Tambahkan fetchGuides ke dependencies

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, []);

  // --- Modal Add/Edit Speaking Guide ---
  const openFormModal = useCallback((guide = null) => {
    if (guide) {
      setIsEdit(true);
      setCurrentGuide({
        _id: guide._id,
        name: guide.name,
        description: guide.description,
        price: guide.price,
        image: guide.image || '',
        language: guide.language,
      });
    } else {
      setIsEdit(false);
      setCurrentGuide({
        _id: '',
        name: '',
        description: '',
        price: 200000,
        image: '',
        language: [], // Default kosong, atau bisa diisi ['English']
      });
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
    if (name === 'language') {
      setCurrentGuide((prev) => ({
        ...prev,
        language: value.split(',').map((lang) => lang.trim()).filter(lang => lang !== ''), // Filter out empty strings
      }));
    } else if (name === 'price') {
      setCurrentGuide((prev) => ({ ...prev, [name]: parseInt(value) || 0 })); // Set to 0 if parsing fails
    } else {
      setCurrentGuide((prev) => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Basic validation
    if (!currentGuide.name || !currentGuide.description || currentGuide.price === 0 || !currentGuide.language.length) {
      setError('Name, Description, Price, and at least one Language are required.');
      return;
    }
    if (currentGuide.price < 200000) {
      setError('Price must be at least 200,000');
      return;
    }

    const payload = {
      name: currentGuide.name,
      description: currentGuide.description,
      price: currentGuide.price,
      image: currentGuide.image,
      language: currentGuide.language,
    };

    try {
      if (isEdit) {
        const response = await axios.put(
          `${BACKEND_URL}/api/speaking-guides/${currentGuide._id}`,
          payload,
          { headers: { Authorization: `Bearer ${authToken}` } } // Gunakan authToken
        );
        setGuides(
          guides.map((guide) => (guide._id === currentGuide._id ? response.data : guide))
        );
      } else {
        const response = await axios.post(`${BACKEND_URL}/api/speaking-guides`, payload, {
          headers: { Authorization: `Bearer ${authToken}` }, // Gunakan authToken
        });
        setGuides([...guides, response.data]);
      }
      closeFormModal();
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save speaking guide');
      console.error('Submit error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [isEdit, currentGuide, BACKEND_URL, authToken, guides, closeFormModal, handleLogout]);

  // --- Modal Konfirmasi Delete ---
  const openConfirmModal = useCallback((guide) => {
    setGuideToDelete(guide);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setGuideToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!guideToDelete) return; // Pastikan ada guide yang akan dihapus
    if (!authToken) {
      setError('Authentication token missing.');
      return;
    }

    try {
      await axios.delete(`${BACKEND_URL}/api/speaking-guides/${guideToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }, // Gunakan authToken
      });
      setGuides(guides.filter((guide) => guide._id !== guideToDelete._id));
      closeConfirmModal(); // Tutup modal setelah berhasil
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete speaking guide');
      console.error('Delete error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      closeConfirmModal(); // Tetap tutup modal meskipun ada error
    }
  }, [guideToDelete, BACKEND_URL, authToken, guides, closeConfirmModal, handleLogout]);

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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Speaking Guides</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Speaking Guide
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
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Languages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guides.length === 0 && !error ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No speaking guides found.
                      </td>
                    </tr>
                  ) : (
                    guides.map((guide) => (
                      <tr key={guide._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {guide.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {guide.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Rp {guide.price.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {guide.language.join(', ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(guide)} // Menggunakan openFormModal
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit speaking guide ${guide.name}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(guide)} // Menggunakan openConfirmModal
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete speaking guide ${guide.name}`}
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

        {/* Modal untuk Add/Edit Speaking Guide */}
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
                  className="relative bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl" // Added max-h and overflow
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
                    {isEdit ? 'Edit Speaking Guide' : 'Add Speaking Guide'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="guideName" className="block text-sm font-medium text-gray-700">Name</label>
                      <input
                        type="text"
                        id="guideName"
                        name="name"
                        value={currentGuide.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="guideDescription" className="block text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id="guideDescription"
                        name="description"
                        value={currentGuide.description}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        rows="4"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="guidePrice" className="block text-sm font-medium text-gray-700">Price (Rp)</label>
                      <input
                        type="number"
                        id="guidePrice"
                        name="price"
                        value={currentGuide.price}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        min="200000"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="guideImage" className="block text-sm font-medium text-gray-700">Image URL</label>
                      <input
                        type="text"
                        id="guideImage"
                        name="image"
                        value={currentGuide.image}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        placeholder="https://example.com/image.jpg"
                      />
                       {currentGuide.image && (
                        <div className="mt-2">
                          <img
                            src={currentGuide.image}
                            alt="Guide Preview"
                            className="w-20 h-20 object-cover rounded-md shadow-sm"
                            onError={(e) => {
                              e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=No+Image';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label htmlFor="guideLanguage" className="block text-sm font-medium text-gray-700">Languages (comma-separated)</label>
                      <input
                        type="text"
                        id="guideLanguage"
                        name="language"
                        value={currentGuide.language.join(', ')}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        placeholder="English, Spanish, Indonesian"
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t"> {/* Added pt-4 border-t */}
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
                    Apakah Anda yakin ingin menghapus pemandu bicara{' '}
                    <strong>{guideToDelete?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
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

export default ManageSpeakingGuides;
