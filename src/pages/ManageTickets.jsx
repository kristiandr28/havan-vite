import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiLoaderAlt, BiPlus } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import TicketTable from './tickets/TicketTable';
import TicketFilter from './tickets/TicketFilter';
import TicketFormModal from './tickets/TicketFormModal';
import DeleteConfirmationModal from './tickets/DeleteConfirmationModal';
import { createPortal } from 'react-dom';

function ManageTickets() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [locations, setLocations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for filter and search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestinationFilter, setSelectedDestinationFilter] = useState(null);
  const [selectedDepartureLocationFilter, setSelectedDepartureLocationFilter] = useState(null);
  const [selectedTicketTypeFilter, setSelectedTicketTypeFilter] = useState([]);
  const [minPriceFilter, setMinPriceFilter] = useState('');
  const [maxPriceFilter, setMaxPriceFilter] = useState('');
  const [maxPaxFilter, setMaxPaxFilter] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('en'); // New state for selected language

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [limit] = useState(10);

  // State for Add/Edit form modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentTicket, setCurrentTicket] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  // State for Delete confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [ticketToDelete, setTicketToDelete] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  // --- Utility function to handle API errors ---
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
  }, [handleLogout]);

  // --- Fetch Data Functions ---
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (!authToken) return;
      const params = {
        page: currentPage,
        limit: limit,
        search: searchTerm,
        destination: selectedDestinationFilter?.value,
        departureLocation: selectedDepartureLocationFilter?.value,
        ticketType: selectedTicketTypeFilter.length > 0 ? selectedTicketTypeFilter.map(option => option.value).join(',') : null,
        minPrice: minPriceFilter,
        maxPrice: maxPriceFilter,
        pax: maxPaxFilter,
        lang: selectedLanguage, // Add selected language to the request parameters
      };
      const response = await axios.get(`${BACKEND_URL}/api/tickets`, {
        headers: { Authorization: `Bearer ${authToken}` },
        params: Object.fromEntries(Object.entries(params).filter(([_, v]) => v != null && v !== ''))
      });
      setTickets(response.data.tickets);
      setCurrentPage(response.data.currentPage);
      setTotalPages(response.data.totalPages);
      setTotalResults(response.data.totalResults);
    } catch (err) {
      handleApiError(err, 'Failed to fetch tickets.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, authToken, currentPage, limit, searchTerm, selectedDestinationFilter, selectedDepartureLocationFilter, selectedTicketTypeFilter, minPriceFilter, maxPriceFilter, maxPaxFilter, selectedLanguage, handleApiError]);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [destinationsRes, locationsRes, languagesRes] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/destinations`, { headers: { Authorization: `Bearer ${authToken}` } }),
        axios.get(`${BACKEND_URL}/api/locations`, { headers: { Authorization: `Bearer ${authToken}` } }),
        axios.get(`${BACKEND_URL}/api/languages`, { headers: { Authorization: `Bearer ${authToken}` } }),
      ]);
      setDestinations(destinationsRes.data);
      setLocations(locationsRes.data);
      setLanguages(languagesRes.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch initial data.');
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, authToken, handleApiError]);

  const handleAddLocation = useCallback(async (newLocationName) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/locations`,
        { name: newLocationName },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      await fetchInitialData();
      return response.data;
    } catch (err) {
      handleApiError(err, 'Failed to add location.');
      throw err;
    }
  }, [BACKEND_URL, authToken, fetchInitialData, handleApiError]);

  // --- Side Effects ---
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
      fetchTickets();
    }
  }, [fetchTickets, isAuthenticated]);

  const toggleSidebar = useCallback(() => setSidebarOpen(!sidebarOpen), [sidebarOpen]);

  // --- Modal Functions ---
  const handleCreateNew = useCallback(() => {
    setIsEdit(false);
    // Logika multibahasa: buat array translations untuk setiap bahasa yang tersedia.
    const initialTranslations = languages.map(lang => ({
      // Gunakan ID unik untuk key React
      id: Date.now() + lang.code, 
      // Gunakan _id bahasa untuk konsistensi dengan data dari backend
      language: lang._id, 
      description: ''
    }));
    setCurrentTicket({
      destination: '',
      ticketType: [],
      price: '',
      departureLocation: '',
      pax: '',
      translations: initialTranslations
    });
    setFormErrors({});
    setFormModalOpen(true);
  }, [languages]);
  
  const handleEditTicket = useCallback(async (ticketToEdit) => {
    try {
      // Panggil endpoint GET /:id untuk mendapatkan data tiket lengkap
      const response = await axios.get(`${BACKEND_URL}/api/tickets/${ticketToEdit._id}`, {
        headers: {
          Authorization: `Bearer ${authToken}` // Kirim token otentikasi
        }
      });
      const fullTicketData = response.data;

      setIsEdit(true);

      // Gabungkan terjemahan yang ada dengan semua bahasa yang didukung
      const initialTranslations = languages.map(lang => {
        const existingTranslation = (fullTicketData.translations || []).find(t => t.language._id === lang._id);
        return {
          id: existingTranslation?._id || lang._id,
          language: existingTranslation?.language._id || lang._id,
          description: existingTranslation?.description || ''
        };
      });

      // Atur state dengan data tiket lengkap yang telah diformat
      setCurrentTicket({
        ...fullTicketData,
        price: fullTicketData.price != null ? fullTicketData.price.toString() : '',
        maxPax: fullTicketData.maxPax != null ? fullTicketData.maxPax.toString() : '1',
        destination: fullTicketData.destination ? fullTicketData.destination._id : null,
        departureLocation: fullTicketData.departureLocation ? fullTicketData.departureLocation._id : null,
        // **PERBAIKAN**: Mengatur ticketType sebagai array string, sesuai dengan skema Mongoose
        ticketType: fullTicketData.ticketType || [], 
        translations: initialTranslations, // Gunakan array terjemahan yang sudah dipersiapkan
        image: null
      });

      // Atur preview gambar jika ada
      setFormErrors({});
      setError('');

      // Buka modal atau form
      setFormModalOpen(true);

    } catch (err) {
      handleApiError(err, 'Failed to fetch ticket data for editing.');
    }
  }, [BACKEND_URL, authToken, handleApiError, languages]);


  const closeFormModal = () => {
    setFormModalOpen(false);
    setCurrentTicket(null);
    setFormErrors({});
  };

  const handleConfirmDelete = (ticket) => {
    setTicketToDelete(ticket);
    setConfirmModalOpen(true);
  };

  const closeConfirmModal = () => {
    setConfirmModalOpen(false);
    setTicketToDelete(null);
  };

  // --- Handle CRUD Operations ---
  const handleSubmit = useCallback(async (ticketData, imageFile) => {
    try {
      // Buat FormData karena backend menggunakan multer
      const formData = new FormData();
      // Tambahkan data non-file ke FormData
      // Gunakan JSON.stringify untuk array of objects seperti translations
      formData.append('translations', JSON.stringify(ticketData.translations));
      formData.append('destination', ticketData.destination);
      formData.append('departureLocation', ticketData.departureLocation);
      formData.append('price', ticketData.price);
      formData.append('pax', ticketData.pax);
      // ticketType adalah array, tambahkan satu per satu
      ticketData.ticketType.forEach(type => formData.append('ticketType[]', type));
      
      // Tambahkan file jika ada
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      let response;
      if (isEdit) {
        response = await axios.put(
          `${BACKEND_URL}/api/tickets/${currentTicket._id}`,
          formData, // Gunakan FormData di sini
          { 
            headers: { 
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data' // Penting untuk FormData
            } 
          }
        );
      } else {
        response = await axios.post(`${BACKEND_URL}/api/tickets`, formData, {
          headers: { 
            Authorization: `Bearer ${authToken}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }
      console.log('Operation successful:', response.data);
      await fetchTickets();
      closeFormModal();
    } catch (err) {
      handleApiError(err, 'Failed to save ticket.');
    }
  }, [isEdit, currentTicket, BACKEND_URL, authToken, fetchTickets, handleApiError]);

  const handleDelete = useCallback(async () => {
    try {
      await axios.delete(`${BACKEND_URL}/api/tickets/${ticketToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Deleted ticket:', ticketToDelete._id);
      await fetchTickets();
      closeConfirmModal();
    } catch (err) {
      handleApiError(err, 'Failed to delete ticket.');
      closeConfirmModal();
    }
  }, [BACKEND_URL, authToken, fetchTickets, closeConfirmModal, ticketToDelete, handleApiError]);

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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-havanaGray">Manage Tickets</h2>
              <button
                onClick={handleCreateNew}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Ticket
              </button>
            </div>
            <TicketFilter 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedDestinationFilter={selectedDestinationFilter}
              setSelectedDestinationFilter={setSelectedDestinationFilter}
              selectedDepartureLocationFilter={selectedDepartureLocationFilter}
              setSelectedDepartureLocationFilter={setSelectedDepartureLocationFilter}
              selectedTicketTypeFilter={selectedTicketTypeFilter}
              setSelectedTicketTypeFilter={setSelectedTicketTypeFilter}
              minPriceFilter={minPriceFilter}
              setMinPriceFilter={setMinPriceFilter}
              maxPriceFilter={maxPriceFilter}
              setMaxPriceFilter={setMaxPriceFilter}
              maxPaxFilter={maxPaxFilter}
              setMaxPaxFilter={setMaxPaxFilter}
              destinations={destinations}
              locations={locations}
              languages={languages}
              selectedLanguage={selectedLanguage}
              setSelectedLanguage={setSelectedLanguage}
              setCurrentPage={setCurrentPage}
            />

            <TicketTable 
              tickets={tickets}
              openFormModal={handleEditTicket}
              openConfirmModal={handleConfirmDelete}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              totalPages={totalPages}
              totalResults={totalResults}
            />
          </div>
        </div>

        {formModalOpen &&
          createPortal(
            <TicketFormModal
              isEdit={isEdit}
              currentTicket={currentTicket}
              closeModal={closeFormModal}
              handleSubmit={handleSubmit}
              destinations={destinations}
              locations={locations}
              handleAddLocation={handleAddLocation}
              languages={languages}
              formErrors={formErrors}
              setFormErrors={setFormErrors}
            />,
            document.body
          )}

        {confirmModalOpen &&
          createPortal(
            <DeleteConfirmationModal
              ticketToDelete={ticketToDelete}
              closeModal={closeConfirmModal}
              handleDelete={handleDelete}
            />,
            document.body
          )}
      </div>
    </div>
  );
}

export default ManageTickets;
