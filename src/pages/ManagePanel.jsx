import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import ManageDestinationsTable from './destinations/ManageDestinationsTable';
import DestinationFormModal from './destinations/DestinationFormModal';
import ManageLocationsTable from './destinations/ManageLocationsTable';
import LocationFormModal from './destinations/LocationFormModal';
import ConfirmDeleteModal from './destinations/ConfirmDeleteModal';

function ManagePanel() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const [activeTab, setActiveTab] = useState('destinations'); // New state for tabs



  const [destinations, setDestinations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // States for Destinations
  const [destinationSearchTerm, setDestinationSearchTerm] = useState('');
  const [destinationCurrentPage, setDestinationCurrentPage] = useState(1);
  const [destinationTotalPages, setDestinationTotalPages] = useState(1);
  const [destinationTotalResults, setDestinationTotalResults] = useState(0);
  const [destinationFormModalOpen, setDestinationFormModalOpen] = useState(false);
  const [isEditDestination, setIsEditDestination] = useState(false);
  const [currentDestination, setCurrentDestination] = useState(null);
  const [destinationImagePreview, setDestinationImagePreview] = useState(null);
  const [destinationImageError, setDestinationImageError] = useState('');
  const [destinationFormErrors, setDestinationFormErrors] = useState({});
  const [destinationToDelete, setDestinationToDelete] = useState(null);

  // States for Locations
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [locationFormModalOpen, setLocationFormModalOpen] = useState(false);
  const [isEditLocation, setIsEditLocation] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [locationFormErrors, setLocationFormErrors] = useState({});
  const [filteredLocations, setFilteredLocations] = useState([]);

  // Function to handle API errors
  const handleApiError = useCallback((err, defaultMessage) => {
    let errorMessage = defaultMessage;
    if (axios.isAxiosError(err)) {
      errorMessage = err.response?.data?.message || `Error ${err.response?.status}`;
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    } else {
      errorMessage = err.message;
    }
    setError(errorMessage);
    console.error('API error:', err);
  }, [handleLogout]);

  // Fetching data
  const fetchDestinations = useCallback(async () => {
    setLoading(true);
    setError('');
    const params = {
      page: destinationCurrentPage,
      limit: 10,
      search: destinationSearchTerm,
    };
    try {
      const response = await axios.get(`${BACKEND_URL}/api/destinations`, { params });
      setDestinations(response.data);
      setDestinationCurrentPage(1);
      setDestinationTotalPages(1);
      setDestinationTotalResults(response.data.length);
    } catch (err) {
      handleApiError(err, 'Failed to fetch destinations.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, destinationCurrentPage, destinationSearchTerm, handleApiError]);

  const fetchLocations = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BACKEND_URL}/api/locations`);
      setLocations(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch locations.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, handleApiError]);

  const fetchLanguages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${BACKEND_URL}/api/languages`);
      setLanguages(response.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch languages.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, handleApiError]);

  useEffect(() => {
    if (isAuthReady) {
      if (!isAuthenticated || user.role !== 'admin') {
        navigate(isAuthenticated ? '/' : '/login', { replace: true });
      } else {
        fetchLanguages();
      }
    }
  }, [isAuthReady, isAuthenticated, user, navigate, fetchLanguages]);

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === 'destinations') {
        fetchDestinations();
      } else {
        fetchLocations();
      }
    }
  }, [isAuthenticated, activeTab, fetchDestinations, fetchLocations]);

  // Filtering locations based on search term
  useEffect(() => {
    if (locationSearchTerm) {
      const filtered = locations.filter(loc =>
        loc.name.toLowerCase().includes(locationSearchTerm.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [locations, locationSearchTerm]);

  // --- Destination Management Functions ---
  const handleDestinationPageChange = useCallback((page) => {
    setDestinationCurrentPage(page);
  }, []);

  const handleCreateNewDestination = useCallback(() => {
    setIsEditDestination(false);
    const initialTranslations = languages.map(lang => ({
      id: Date.now() + lang._id,
      language: lang.code,
      name: '',
      description: ''
    }));
    setCurrentDestination({
      translations: initialTranslations,
      location: '',
      image: '',
    });
    setDestinationImagePreview(null);
    setDestinationFormErrors({});
    setDestinationFormModalOpen(true);
  }, [languages]);

  const handleEditDestination = useCallback(async (destination) => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/destinations/${destination._id}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const fullDestinationData = response.data;

      setIsEditDestination(true);
      setCurrentDestination({
        ...fullDestinationData,
        translations: fullDestinationData.translations.map(t => ({
          ...t,
          id: t._id || Math.random(),
          language: t.language.code,
        })),
        location: fullDestinationData.location
          ? {
              value: fullDestinationData.location._id,
              label: fullDestinationData.location.name, // pastikan pakai nama lokasi
            }
          : null,
        image: null,
      });
      setDestinationImagePreview(fullDestinationData.image ? `${BACKEND_URL}${fullDestinationData.image}` : null);
      setDestinationFormErrors({});
      setError('');
      setDestinationFormModalOpen(true);
    } catch (err) {
      handleApiError(err, 'Failed to fetch destination data for editing');
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  const handleConfirmDeleteDestination = (destination) => {
    setDestinationToDelete(destination);
    setConfirmModalOpen(true);
  };

  const handleDeleteDestination = async () => {
    if (!destinationToDelete) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/destinations/${destinationToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setConfirmModalOpen(false);
      setDestinationToDelete(null);
      fetchDestinations();
    } catch (err) {
      handleApiError(err, 'Failed to delete destination.');
      setConfirmModalOpen(false);
    }
  };
  
  const closeDestinationFormModal = () => {
    setDestinationFormModalOpen(false);
    setCurrentDestination(null);
    setDestinationImagePreview(null);
  };

  // --- Location Management Functions ---
  const handleCreateNewLocation = useCallback(() => {
    setIsEditLocation(false);
    const initialTranslations = languages.map(lang => ({
      id: Date.now() + lang._id,
      language: lang.code,
      name: ''
    }));
    setCurrentLocation({ translations: initialTranslations });
    setLocationFormErrors({});
    setLocationFormModalOpen(true);
  }, [languages]);

  const handleEditLocation = useCallback(async (location) => {
    setIsEditLocation(true);
    setCurrentLocation({
      ...location,
      translations: location.translations.map(t => ({
        ...t,
        id: t._id || Math.random(),
        language: t.language.code,
      })),
    });
    setLocationFormErrors({});
    setLocationFormModalOpen(true);
  }, []);

  const handleConfirmDeleteLocation = (location) => {
    setLocationToDelete(location);
    setConfirmModalOpen(true);
  };

  const handleDeleteLocation = async () => {
    if (!locationToDelete) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/locations/${locationToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setConfirmModalOpen(false);
      setLocationToDelete(null);
      fetchLocations();
    } catch (err) {
      handleApiError(err, 'Failed to delete location.');
      setConfirmModalOpen(false);
    }
  };

  const closeLocationFormModal = () => {
    setLocationFormModalOpen(false);
    setCurrentLocation(null);
  };
  
  // --- Global Modal States ---
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const handleDelete = activeTab === 'destinations' ? handleDeleteDestination : handleDeleteLocation;
  const itemToDelete = activeTab === 'destinations' ? destinationToDelete : locationToDelete;
  const itemType = activeTab === 'destinations' ? 'destinasi' : 'lokasi';

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

            {/* Tab Navigation */}
            <div className="mb-6 border-b border-gray-200">
              <div className="flex -mb-px space-x-8" role="tablist">
                <button
                  onClick={() => setActiveTab('destinations')}
                  className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'destinations' ? 'border-b-2 border-havanaBlue text-havanaBlue' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Destinations
                </button>
                <button
                  onClick={() => setActiveTab('locations')}
                  className={`py-2 px-4 text-sm font-medium focus:outline-none ${activeTab === 'locations' ? 'border-b-2 border-havanaBlue text-havanaBlue' : 'border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
                >
                  Locations
                </button>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === 'destinations' ? (
              <ManageDestinationsTable
                destinations={destinations}
                searchTerm={destinationSearchTerm}
                setSearchTerm={setDestinationSearchTerm}
                onPageChange={handleDestinationPageChange}
                currentPage={destinationCurrentPage}
                totalPages={destinationTotalPages}
                totalResults={destinationTotalResults}
                onAddDestination={handleCreateNewDestination}
                onEditDestination={handleEditDestination}
                onDeleteDestination={handleConfirmDeleteDestination}
              />
            ) : (
              <ManageLocationsTable
                locations={filteredLocations}
                searchTerm={locationSearchTerm}
                setSearchTerm={setLocationSearchTerm}
                onAddLocation={handleCreateNewLocation}
                onEditLocation={handleEditLocation}
                onDeleteLocation={handleConfirmDeleteLocation}
              />
            )}
          </div>
        <DestinationFormModal
          isOpen={destinationFormModalOpen}
          onClose={closeDestinationFormModal}
          isEdit={isEditDestination}
          currentDestination={currentDestination}
          setCurrentDestination={setCurrentDestination}
          imagePreview={destinationImagePreview}
          setImagePreview={setDestinationImagePreview}
          imageError={destinationImageError}
          setImageError={setDestinationImageError}
          formErrors={destinationFormErrors}
          setFormErrors={setDestinationFormErrors}
          locations={locations}
          languages={languages}
          BACKEND_URL={BACKEND_URL}
          authToken={authToken}
          fetchDestinations={fetchDestinations}
          handleApiError={handleApiError}
        />
        <LocationFormModal
          isOpen={locationFormModalOpen}
          onClose={closeLocationFormModal}
          isEdit={isEditLocation}
          currentLocation={currentLocation}
          setCurrentLocation={setCurrentLocation}
          languages={languages}
          BACKEND_URL={BACKEND_URL}
          authToken={authToken}
          fetchLocations={fetchLocations}
          handleApiError={handleApiError}
        />
        <ConfirmDeleteModal
          isOpen={confirmModalOpen}
          onClose={() => setConfirmModalOpen(false)}
          onConfirm={handleDelete}
          itemName={itemToDelete?.name}
          itemType={itemType}
        />
      </div>
    </div>
  );
}

export default ManagePanel;