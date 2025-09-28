import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import ManageActivitiesTable from './activities/ManageActivitiesTable';
import ActivityFormModal from './activities/ActivityFormModal';
import ConfirmDeleteModal from './activities/ConfirmDeleteModal';

function ManageActivities() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const [activities, setActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [includedItems, setIncludedItems] = useState([]);
  const [excludedItems, setExcludedItems] = useState([]);
  const [languages, setLanguages] = useState([]); // Tambahkan state untuk bahasa
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minPax, setMinPax] = useState('');
  const [maxPax, setMaxPax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState(null);

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
    console.error('API error:', err);
  }, [handleLogout, setError]);

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = {
      page: currentPage,
      limit: 10,
      search: searchTerm,
      category: selectedCategory,
      minPrice,
      maxPrice,
      minPax,
      maxPax
    };
    try {
      const response = await axios.get(`${BACKEND_URL}/api/activities`, { params });
      setActivities(response.data.activities);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalResults(response.data.totalResults);
    } catch (err) {
      handleApiError(err, 'Failed to fetch activities.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, currentPage, searchTerm, selectedCategory, minPrice, maxPrice, minPax, maxPax, handleApiError]);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [
        categoriesRes,
        includedRes,
        excludedRes,
        languagesRes, // Ambil data languages
      ] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/categories`),
        axios.get(`${BACKEND_URL}/api/included`),
        axios.get(`${BACKEND_URL}/api/excluded`),
        axios.get(`${BACKEND_URL}/api/languages`), // Panggil endpoint languages
      ]);
      setCategories(categoriesRes.data);
      setIncludedItems(includedRes.data);
      setExcludedItems(excludedRes.data.data);
      setLanguages(languagesRes.data); // Simpan data bahasa ke dalam state
    } catch (err) {
      handleApiError(err, 'Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, handleApiError]);

  useEffect(() => {
    if (isAuthReady) {
      if (!isAuthenticated || user.role !== 'admin') {
        navigate(isAuthenticated ? '/' : '/login', { replace: true });
      } else {
        fetchInitialData();
      }
    }
  }, [isAuthReady, isAuthenticated, user, navigate, fetchInitialData]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchActivities();
    }
  }, [fetchActivities, isAuthenticated]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  const handleCreateNew = useCallback(() => {
    setIsEdit(false);
    // Inisialisasi translations dengan semua bahasa yang tersedia
    const initialTranslations = languages.map(lang => ({
      id: Date.now() + lang.code, // Tambahkan ID unik untuk key React
      language: lang.code,
      name: '',
      description: ''
    }));
    setCurrentActivity({
      translations: initialTranslations,
      category: '',
      image: '',
      price: '',
      duration: '',
      included: [],
      excluded: [],
      pax: '',
    });
    setImagePreview(null);
    setFormErrors({});
    setFormModalOpen(true);
  }, [languages]); // Tambahkan languages sebagai dependensi

const handleEditActivity = useCallback(async (activity) => {
    try {
      // Mengambil data aktivitas lengkap dari backend
      const response = await axios.get(`${BACKEND_URL}/api/activities/${activity._id}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const fullActivityData = response.data;

      setIsEdit(true);
      
      // Memproses data yang diterima untuk mengisi state
      setCurrentActivity({
        ...fullActivityData,
        translations: fullActivityData.translations.map(t => ({
          ...t,
          id: t._id || Math.random(), // Gunakan ID atau fallback ke ID sementara
          language: t.language.code, // Menggunakan kode bahasa (misalnya 'en', 'id')
        })),
        included: (fullActivityData.included || []).map(item => item._id),
        excluded: (fullActivityData.excluded || []).map(item => item._id),
        category: fullActivityData.category?._id,
        image: null // Atur image ke null untuk menghindari pengiriman file yang sama
      });
      
      // Menampilkan pratinjau gambar jika ada
      setImagePreview(fullActivityData.image ? `${BACKEND_URL}${fullActivityData.image}` : null);
      
      // Mengatur ulang error dan membuka modal
      setFormErrors({});
      setError('');
      setFormModalOpen(true);
    } catch (err) {
      handleApiError(err, 'Failed to fetch activity data for editing', handleLogout, setError);
    }
  }, [BACKEND_URL, authToken, handleLogout]);

  const handleConfirmDelete = (activity) => {
    setActivityToDelete(activity);
    setConfirmModalOpen(true);
  };

  const handleDelete = async () => {
    if (!activityToDelete) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/activities/${activityToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setConfirmModalOpen(false);
      setActivityToDelete(null);
      fetchActivities();
    } catch (err) {
      handleApiError(err, 'Failed to delete activity.');
      setConfirmModalOpen(false);
    }
  };

  const closeFormModal = () => {
    setFormModalOpen(false);
    setCurrentActivity(null);
    setImagePreview(null);
  };

  if (!isAuthReady || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <BiLoaderAlt className="animate-spin text-4xl text-gray-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 md:ml-64">
        <AdminHeader setSidebarOpen={setSidebarOpen} />
          <div className="pt-20 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {error && <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}
            <ManageActivitiesTable
              activities={activities}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              minPrice={minPrice}
              setMinPrice={setMinPrice}
              maxPrice={maxPrice}
              setMaxPrice={setMaxPrice}
              minPax={minPax}
              setMinPax={setMinPax}
              maxPax={maxPax}
              setMaxPax={setMaxPax}
              categoryOptions={categories.map(c => ({ value: c._id, label: c.name }))}
              onPageChange={handlePageChange}
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              onAddActivity={handleCreateNew}
              onEditActivity={handleEditActivity}
              onDeleteActivity={handleConfirmDelete}
            />
          </div>
        <ActivityFormModal
          isOpen={formModalOpen}
          onClose={closeFormModal}
          isEdit={isEdit}
          currentActivity={currentActivity}
          setCurrentActivity={setCurrentActivity}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          imageError={imageError}
          setImageError={setImageError}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          categories={categories}
          includedItems={includedItems}
          excludedItems={excludedItems}
          BACKEND_URL={BACKEND_URL}
          authToken={authToken}
          fetchActivities={fetchActivities}
          setError={setError}
          handleLogout={handleLogout}
        />
        <ConfirmDeleteModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleDelete}
          itemName={activityToDelete?.name}
          itemType="aktivitas"
        />
      </div>
    </div>
  );
}

export default ManageActivities;