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

function ManageGallery() {
  // Ambil state dan fungsi auth dari useAuth
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State untuk modal Add/Edit Photo
  const [formModalOpen, setFormModalOpen] = useState(false); // Ganti nama agar tidak bentrok
  const [isEdit, setIsEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [currentPhoto, setCurrentPhoto] = useState({
    _id: '',
    file: null,
    filename: '', // Menyimpan filename untuk tampilan di modal edit
  });

  // State untuk modal konfirmasi Delete
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [photoToDelete, setPhotoToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL; // Gunakan env variable

  // --- Fetch Data Function (Dideklarasikan sebelum useEffect) ---
  const fetchPhotos = useCallback(async () => {
    try {
      // Gunakan authToken dari useAuth
      const response = await axios.get(`${BACKEND_URL}/api/photos`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      console.log('Photos:', response.data);
      setPhotos(response.data);
    } catch (err) {
      let errorMessage = 'Failed to fetch photos';
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
      console.error('Fetch photos error:', err);
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

    fetchPhotos();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken, fetchPhotos]); // Tambahkan fetchPhotos ke dependencies

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, []);

  // --- Modal Add/Edit Photo ---
  const openFormModal = useCallback((photo = null) => {
    if (photo) {
      setIsEdit(true);
      const imageUrl = photo.path ? `${BACKEND_URL}${photo.path}` : null;
      setCurrentPhoto({
        _id: photo._id,
        file: null, // Jangan set file object saat edit, hanya untuk upload baru
        filename: photo.filename, // Simpan filename yang ada
      });
      setImagePreview(imageUrl);
    } else {
      setIsEdit(false);
      setCurrentPhoto({
        _id: '',
        file: null,
        filename: '',
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

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Max 5MB
        setImageError('Image size must be less than 5MB');
        setCurrentPhoto((prev) => ({ ...prev, file: null }));
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setImageError('Only JPEG and PNG images are allowed');
        setCurrentPhoto((prev) => ({ ...prev, file: null }));
        if (imagePreview) URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
        return;
      }
      setImageError('');
      setCurrentPhoto((prev) => ({ ...prev, file: file }));
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview); // Revoke previous URL if exists
      }
      setImagePreview(URL.createObjectURL(file));
    } else {
      // Jika file dihapus dari input file
      setCurrentPhoto((prev) => ({ ...prev, file: null }));
      if (imagePreview) URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
      setImageError('');
    }
  }, [imagePreview]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (imageError) {
      setError(imageError);
      return;
    }
    if (!isEdit && !currentPhoto.file) { // Image is required only for new photos
      setError('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    if (currentPhoto.file) {
      formData.append('image', currentPhoto.file); // Ganti 'photo' menjadi 'image' sesuai backend
    }
    // Jika edit, dan tidak ada file baru diupload, jangan kirim 'image'
    // Jika edit, dan ada file baru diupload, kirim file baru

    console.log('FormData entries:', [...formData.entries()]);

    try {
      if (isEdit) {
        // Untuk edit, hanya kirim formData jika ada file baru yang dipilih
        // Jika tidak ada file baru, kita tidak perlu melakukan PUT request file
        if (currentPhoto.file) {
          const response = await axios.put(
            `${BACKEND_URL}/api/photos/${currentPhoto._id}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${authToken}`, // Gunakan authToken
              },
            }
          );
          setPhotos(
            photos.map((photo) =>
              photo._id === currentPhoto._id ? response.data : photo
            )
          );
        } else {
          // Jika tidak ada file baru diupload saat edit, cukup tutup modal
          // Asumsi tidak ada field lain yang bisa diedit di sini selain gambar
          // Jika ada field lain, logika ini perlu disesuaikan
          console.log("No new image selected for edit, closing modal.");
        }
      } else {
        const response = await axios.post(
          `${BACKEND_URL}/api/photos`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${authToken}`, // Gunakan authToken
            },
          }
        );
        setPhotos([...photos, response.data]);
      }
      closeFormModal();
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save photo');
      console.error('Submit error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [isEdit, currentPhoto, imageError, BACKEND_URL, authToken, photos, closeFormModal, handleLogout]);

  // --- Modal Konfirmasi Delete ---
  const openConfirmModal = useCallback((photo) => {
    setPhotoToDelete(photo);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setPhotoToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!photoToDelete) return; // Pastikan ada foto yang akan dihapus

    try {
      await axios.delete(`${BACKEND_URL}/api/photos/${photoToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }, // Gunakan authToken
      });
      setPhotos(photos.filter((photo) => photo._id !== photoToDelete._id));
      closeConfirmModal(); // Tutup modal setelah berhasil
      setError(''); // Clear global error on success
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete photo');
      console.error('Delete error:', err.response?.data || err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
      closeConfirmModal(); // Tetap tutup modal meskipun ada error
    }
  }, [photoToDelete, BACKEND_URL, authToken, photos, closeConfirmModal, handleLogout]);

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
              <h3 className="text-xl font-semibold text-havanaGray">Manage Gallery</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Photo
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Filename
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uploaded
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {photos.length === 0 && !error ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No photos found.
                      </td>
                    </tr>
                  ) : (
                    photos.map((photo) => (
                      <tr key={photo._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {photo.path ? (
                            <img
                              src={`${BACKEND_URL}${photo.path}`}
                              alt={photo.filename}
                              className="h-10 w-10 object-cover rounded"
                              onError={(e) => {
                                console.error(`Image load error for ${photo.filename}:`, `${BACKEND_URL}${photo.path}`);
                                e.target.src = 'https://placehold.co/40x40/cccccc/ffffff?text=No+Image'; // Placeholder
                              }}
                            />
                          ) : (
                            'No Image'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {photo.filename}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(photo.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(photo)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit photo ${photo.filename}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(photo)} // Membuka modal konfirmasi
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete photo ${photo.filename}`}
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

        {/* Modal untuk Add/Edit Photo */}
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
                  className="relative bg-white rounded-lg p-8 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl"
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
                  <h3 className="text-lg font-semibold text-havanaGray mb-6">
                    {isEdit ? 'Edit Photo' : 'Add Photo'}
                  </h3>
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="photoFile" className="block text-sm font-medium text-gray-700">Photo</label>
                        <input
                          type="file"
                          id="photoFile"
                          accept="image/jpeg,image/png"
                          onChange={handleImageChange}
                          className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-havanaBlue file:text-white hover:file:bg-blue-700"
                        />
                        {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mt-2 h-40 w-full object-cover rounded-md"
                            onError={(e) => {
                              console.error('Preview load error:', imagePreview);
                              e.target.src = 'https://placehold.co/300x160/cccccc/ffffff?text=No+Preview'; // Placeholder
                            }}
                          />
                        )}
                        {/* Tampilkan gambar yang sudah ada jika tidak ada preview baru dan sedang dalam mode edit */}
                        {!imagePreview && isEdit && currentPhoto.filename && (
                          <div className="mt-4">
                            <img
                              src={`${BACKEND_URL}/uploads/${currentPhoto.filename}`}
                              alt="Current"
                              className="h-40 w-full object-cover rounded-md"
                              onError={(e) => {
                                console.error('Current image load error:', `${BACKEND_URL}/uploads/${currentPhoto.filename}`);
                                e.target.src = 'https://placehold.co/300x160/cccccc/ffffff?text=No+Image'; // Placeholder
                              }}
                            />
                            <p className="mt-1 text-sm text-gray-500">Current: {currentPhoto.filename}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 mt-6">
                      <button
                        type="button"
                        onClick={closeFormModal}
                        className="py-1.5 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 sm:text-sm transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-1.5 px-3 bg-havanaBlue text-white rounded-md hover:bg-blue-700 sm:text-sm transition"
                      >
                        {isEdit ? 'Update' : 'Upload'}
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
                    Apakah Anda yakin ingin menghapus foto <strong>{photoToDelete?.filename}</strong>?
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

export default ManageGallery;
