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

function ManageHeroes() {
  // Ambil state dan fungsi auth dari useAuth
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [heroes, setHeroes] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk modal Add/Edit Hero
  const [formModalOpen, setFormModalOpen] = useState(false); // Ganti nama agar tidak bentrok
  const [isEdit, setIsEdit] = useState(false);
  const [currentHero, setCurrentHero] = useState({
    _id: '',
    title: '',
    subtitle: '',
    image: null, // Akan menyimpan File object untuk upload baru
    buttonText: '',
    buttonLink: '',
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState(''); // State untuk error gambar

  // State untuk modal konfirmasi Delete
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [heroToDelete, setHeroToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL; // Gunakan env variable

  // --- Fetch Data Function (Dideklarasikan sebelum useEffect) ---
  const fetchHeroes = useCallback(async () => {
    try {
      // Gunakan authToken dari useAuth
      const response = await axios.get(`${BACKEND_URL}/api/heroes`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setHeroes(response.data);
    } catch (err) {
      let errorMessage = 'Failed to fetch heroes';
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
      console.error('Fetch heroes error:', err);
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

    fetchHeroes();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken, fetchHeroes]); // Tambahkan fetchHeroes ke dependencies

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, []);

  // --- Modal Add/Edit Hero ---
  const openFormModal = useCallback((hero = null) => {
    if (hero) {
      setIsEdit(true);
      setCurrentHero({
        _id: hero._id,
        title: hero.title,
        subtitle: hero.subtitle,
        image: null, // Jangan set image ke file object saat edit, hanya untuk upload baru
        buttonText: hero.buttonText,
        buttonLink: hero.buttonLink,
      });
      setImagePreview(hero.image ? `${BACKEND_URL}${hero.image}` : null);
    } else {
      setIsEdit(false);
      setCurrentHero({
        _id: '',
        title: '',
        subtitle: '',
        image: null,
        buttonText: '',
        buttonLink: '',
      });
      setImagePreview(null);
    }
    setImageError(''); // Clear image error
    setFormModalOpen(true); // Menggunakan setFormModalOpen
    setError(''); // Clear global error
  }, [BACKEND_URL]);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false); // Menggunakan setFormModalOpen
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview); // Bersihkan URL objek jika ada
    }
    setImagePreview(null);
    setImageError('');
    setError(''); // Clear global error
  }, [imagePreview]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentHero((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      // Validasi ukuran dan tipe file
      if (file.size > 5 * 1024 * 1024) { // Max 5MB
        setImageError('Image size must be less than 5MB.');
        setCurrentHero((prev) => ({ ...prev, image: null }));
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        return;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        setImageError('Only JPEG, JPG, and PNG images are allowed.');
        setCurrentHero((prev) => ({ ...prev, image: null }));
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        return;
      }

      setImageError(''); // Clear previous image errors
      setCurrentHero((prev) => ({ ...prev, image: file }));
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview); // Revoke previous URL if exists
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      // Jika file dihapus dari input file
      setCurrentHero((prev) => ({ ...prev, image: null }));
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageError('');
    }
  }, [imagePreview]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    // Basic validation for required text fields
    if (!currentHero.title || !currentHero.subtitle || !currentHero.buttonText || !currentHero.buttonLink) {
      setError('All text fields (Title, Subtitle, Button Text, Button Link) are required.');
      return;
    }
    if (imageError) { // Don't submit if there's an image error
      setError(imageError);
      return;
    }
    // Image is required only for new heroes
    if (!isEdit && !currentHero.image) {
      setError('Image is required for new heroes.');
      return;
    }

    const formData = new FormData();
    formData.append('title', currentHero.title);
    formData.append('subtitle', currentHero.subtitle);
    formData.append('buttonText', currentHero.buttonText);
    formData.append('buttonLink', currentHero.buttonLink);
    if (currentHero.image) { // Only append image if a new one is selected
      formData.append('image', currentHero.image);
    }

    console.log('FormData entries:', [...formData.entries()]);

    try {
      if (isEdit) {
        const response = await axios.put(
          `${BACKEND_URL}/api/heroes/${currentHero._id}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`, // Gunakan authToken
              'Content-Type': 'multipart/form-data', // Penting untuk FormData
            }
          }
        );
        setHeroes(
          heroes.map((hero) =>
            hero._id === currentHero._id ? response.data : hero
          )
        );
      } else {
        const response = await axios.post(
          `${BACKEND_URL}/api/heroes`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`, // Gunakan authToken
              'Content-Type': 'multipart/form-data', // Penting untuk FormData
            },
          }
        );
        setHeroes([...heroes, response.data]);
      }
      closeFormModal();
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save hero');
      console.error('Submit error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [isEdit, currentHero, imageError, BACKEND_URL, authToken, heroes, closeFormModal, handleLogout]);

  // --- Modal Konfirmasi Delete ---
  const openConfirmModal = useCallback((hero) => {
    setHeroToDelete(hero);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setHeroToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!heroToDelete) return; // Pastikan ada hero yang akan dihapus

    try {
      await axios.delete(`${BACKEND_URL}/api/heroes/${heroToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }, // Gunakan authToken
      });
      setHeroes(heroes.filter((hero) => hero._id !== heroToDelete._id));
      closeConfirmModal(); // Tutup modal setelah berhasil
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete hero');
      console.error('Delete error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      closeConfirmModal(); // Tetap tutup modal meskipun ada error
    }
  }, [heroToDelete, BACKEND_URL, authToken, heroes, closeConfirmModal, handleLogout]);

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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Heroes</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Hero
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subtitle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Button Text
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Button Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {heroes.length === 0 && !error ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No heroes found.
                      </td>
                    </tr>
                  ) : (
                    heroes.map((hero) => (
                      <tr key={hero._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hero.title}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {hero.subtitle.length > 50
                            ? `${hero.subtitle.substring(0, 50)}...`
                            : hero.subtitle}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hero.buttonText}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hero.buttonLink}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {hero.image ? (
                            <img
                              src={`${BACKEND_URL}${hero.image}`}
                              alt={hero.title}
                              className="h-10 w-10 object-cover rounded"
                              onError={(e) => {
                                console.error(`Image load error for ${hero.title}:`, `${BACKEND_URL}${hero.image}`);
                                e.target.src = 'https://placehold.co/40x40/cccccc/ffffff?text=No+Image'; // Placeholder
                              }}
                            />
                          ) : (
                            'No Image'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(hero)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit hero ${hero.title}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(hero)} // Membuka modal konfirmasi
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete hero ${hero.title}`}
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

        {/* Modal untuk Add/Edit Hero */}
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
                    {isEdit ? 'Edit Hero' : 'Add Hero'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="heroTitle" className="block text-sm font-medium text-gray-700">Title</label>
                      <input
                        type="text"
                        id="heroTitle"
                        name="title"
                        value={currentHero.title}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="heroSubtitle" className="block text-sm font-medium text-gray-700">Subtitle</label>
                      <textarea
                        id="heroSubtitle"
                        name="subtitle"
                        value={currentHero.subtitle}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        rows="4"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="heroButtonText" className="block text-sm font-medium text-gray-700">Button Text</label>
                      <input
                        type="text"
                        id="heroButtonText"
                        name="buttonText"
                        value={currentHero.buttonText}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="heroButtonLink" className="block text-sm font-medium text-gray-700">Button Link</label>
                      <input
                        type="text"
                        id="heroButtonLink"
                        name="buttonLink"
                        value={currentHero.buttonLink}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                        required
                      />
                    </div>
                    <div>
                      <label htmlFor="heroImage" className="block text-sm font-medium text-gray-700">Image</label>
                      <input
                        type="file"
                        id="heroImage"
                        name="image"
                        accept="image/jpeg,image/jpg,image/png" // Specific image types
                        onChange={handleImageChange}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-havanaBlue file:text-white hover:file:bg-blue-700"
                      />
                      {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                      {imagePreview && (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="mt-2 h-20 w-20 object-cover rounded"
                          onError={(e) => {
                            console.error('Preview load error:', imagePreview);
                            e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=No+Preview'; // Placeholder
                          }}
                        />
                      )}
                      {/* Tampilkan gambar yang sudah ada jika tidak ada preview baru dan sedang dalam mode edit */}
                      {!imagePreview && isEdit && currentHero.image && (
                         <div className="mt-2">
                           <img
                             src={`${BACKEND_URL}${currentHero.image}`}
                             alt="Current"
                             className="h-20 w-20 object-cover rounded"
                             onError={(e) => {
                               console.error('Current image load error:', `${BACKEND_URL}${currentHero.image}`);
                               e.target.src = 'https://placehold.co/80x80/cccccc/ffffff?text=No+Image'; // Placeholder
                             }}
                           />
                         </div>
                       )}
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
                    Apakah Anda yakin ingin menghapus hero <strong>{heroToDelete?.title}</strong>?
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

export default ManageHeroes;
