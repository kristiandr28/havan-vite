import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import ManageToursTable from './tours/ManageToursTable';
import TourFormModal from './tours/TourFormModal';
import ConfirmDeleteModal from './tours/ConfirmDeleteModal';

function ManageTours() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [tours, setTours] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [includedItems, setIncludedItems] = useState([]);
  const [excludedItems, setExcludedItems] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // State for search and filter
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState([]);
  const [selectedDestinations, setSelectedDestinations] = useState([]);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedMaxPax, setSelectedMaxPax] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  // State for modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [currentTour, setCurrentTour] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState(null);
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState({});

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

  // Fetching logic remains similar
  const fetchTours = useCallback(async () => {
    setLoading(true);
    try {
      if (!authToken) {
        setError('Authentication token missing. Please log in again.');
        return;
      }
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm,
        languages: selectedLanguages.join(','),
        destinations: selectedDestinations.join(','),
        minPrice,
        maxPrice,
        maxPax: selectedMaxPax,
      };
      const response = await axios.get(`${BACKEND_URL}/api/tours`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params,
      });

      const { tours: fetchedTours, currentPage: newCurrentPage, totalPages: newTotalPages, totalResults: newTotalResults } = response.data;
      setTours(fetchedTours || []);
      setCurrentPage(newCurrentPage);
      setTotalPages(newTotalPages);
      setTotalResults(newTotalResults);
    } catch (err) {
      handleApiError(err, 'Failed to fetch tours');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, authToken, handleApiError, currentPage, searchTerm, selectedLanguages, selectedDestinations, minPrice, maxPrice, selectedMaxPax]);

  const fetchLanguages = useCallback(async () => {
    try {
      if (!authToken) return;
      const response = await axios.get(`${BACKEND_URL}/api/languages`, { headers: { Authorization: `Bearer ${authToken}` } });
      setLanguages(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch languages');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  const fetchDestinations = useCallback(async () => {
    try {
      if (!authToken) return;
      const response = await axios.get(`${BACKEND_URL}/api/destinations`, { headers: { Authorization: `Bearer ${authToken}` } });
      setDestinations(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch destinations');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

const fetchIncludedItems = useCallback(async () => {
  try {
    if (!authToken) return;
    const response = await axios.get(`${BACKEND_URL}/api/included`, { headers: { Authorization: `Bearer ${authToken}` } });
    // Perbaikan di sini: Ambil dari response.data.data
    setIncludedItems(response.data);
  } catch (err) {
    handleApiError(err, 'Failed to fetch included items');
  }
}, [BACKEND_URL, authToken, handleApiError]);

const fetchExcludedItems = useCallback(async () => {
  try {
    if (!authToken) return;
    const response = await axios.get(`${BACKEND_URL}/api/excluded`, { headers: { Authorization: `Bearer ${authToken}` } });
    // Perbaikan di sini: Ambil dari response.data.data
    setExcludedItems(response.data.data);
  } catch (err) {
    handleApiError(err, 'Failed to fetch excluded items');
  }
}, [BACKEND_URL, authToken, handleApiError]);

//
  // Combined fetch for initial load
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isAuthReady) return;

      if (!isAuthenticated || user?.role !== 'admin') {
        navigate(isAuthenticated ? '/' : '/login');
        return;
      }

      setLoading(true);
      await Promise.all([
        fetchTours(),
        fetchLanguages(),
        fetchDestinations(),
        fetchIncludedItems(),
        fetchExcludedItems(),
      ]);
      setLoading(false);
    };

    fetchInitialData();
  }, [isAuthenticated, user, isAuthReady, navigate, fetchTours, fetchLanguages, fetchDestinations, fetchIncludedItems, fetchExcludedItems]);

  const toggleSidebar = useCallback(() => setSidebarOpen(prev => !prev), []);

  const handleCreateNew = useCallback(() => {
    if (languages.length === 0) {
      setError('Language data is not available. Please try refreshing the page.');
      return;
    }
    setIsEdit(false);
    setCurrentTour({
      price: '',
      duration: '',
      guideLanguages: [],
      destinations: [],
      itinerary: [],
      included: [],
      excluded: [],
      maxPax: '1',
      tourType: '',
      image: null,
      translations: languages.map(lang => ({ language: lang.code, name: '', description: '' }))
    });
    setImagePreview(null);
    setFormErrors({});
    setError('');
    setFormModalOpen(true);
  }, [languages]);

  const handleEditTour = useCallback(async (tour) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/tours/${tour._id}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const fullTourData = response.data;
      setIsEdit(true);
      setCurrentTour({
        ...fullTourData,
        price: fullTourData.price != null ? fullTourData.price.toString() : '',
        maxPax: fullTourData.maxPax != null ? fullTourData.maxPax.toString() : '1',
        guideLanguages: (fullTourData.guideLanguages || []).map(lang => lang._id),
        destinations: (fullTourData.destinations || []).map(dest => dest._id),
        included: (fullTourData.included || []).map(item => item._id),
        excluded: (fullTourData.excluded || []).map(item => item._id),
        translations: (fullTourData.translations || []).map(t => ({
          ...t,
          language: t.language?.code || t.language,
        })),
        image: null
      });
      setImagePreview(fullTourData.image ? `${BACKEND_URL}${fullTourData.image}` : null);
      setFormErrors({});
      setError('');
      setFormModalOpen(true);
    } catch (err) {
      handleApiError(err, 'Failed to fetch tour data for editing');
    }
  }, [BACKEND_URL, authToken, handleApiError]);


  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageError('');
    setFormErrors({});
    setError('');
  }, [imagePreview]);

  const handleConfirmDelete = useCallback((tour) => {
    setTourToDelete(tour);
    setConfirmModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!tourToDelete || !authToken) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/tours/${tourToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchTours();
      setConfirmModalOpen(false);
      setError('');
    } catch (err) {
      handleApiError(err, 'Failed to delete tour');
      setConfirmModalOpen(false);
    }
  }, [tourToDelete, BACKEND_URL, authToken, handleApiError, fetchTours]);

  const handlePageChange = useCallback((newPage) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  if (!isAuthReady || loading) {
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
          <ManageToursTable
            tours={tours}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedLanguages={selectedLanguages}
            setSelectedLanguages={setSelectedLanguages}
            selectedDestinations={selectedDestinations}
            setSelectedDestinations={setSelectedDestinations}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            selectedMaxPax={selectedMaxPax}
            setSelectedMaxPax={setSelectedMaxPax}
            languageOptions={languages.map(lang => ({ value: lang._id, label: `${lang.name} (${lang.code})` }))}
            destinationOptions={destinations.map(dest => ({ value: dest._id, label: `${dest.name} (${dest.location})` }))}
            maxPaxOptions={Array.from({ length: 10 }, (_, i) => ({ value: (i + 1).toString(), label: i + 1 }))}
            onPageChange={handlePageChange}
            currentPage={currentPage}
            totalPages={totalPages}
            totalResults={totalResults}
            onAddTour={handleCreateNew}
            onEditTour={handleEditTour}
            onDeleteTour={handleConfirmDelete}
            BACKEND_URL={BACKEND_URL}
          />
        </div>
        <TourFormModal
          isOpen={formModalOpen}
          onClose={closeFormModal}
          isEdit={isEdit}
          currentTour={currentTour}
          setCurrentTour={setCurrentTour}
          imagePreview={imagePreview}
          setImagePreview={setImagePreview}
          imageError={imageError}
          setImageError={setImageError}
          formErrors={formErrors}
          setFormErrors={setFormErrors}
          languages={languages}
          destinations={destinations}
          includedItems={includedItems}
          excludedItems={excludedItems}
          BACKEND_URL={BACKEND_URL}
          authToken={authToken}
          fetchTours={fetchTours}
          setError={setError}
          handleLogout={handleLogout}
        />
        <ConfirmDeleteModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleDelete}
          tourName={tourToDelete?.name}
        />
      </div>
    </div>
  );
}

export default ManageTours;