import React, { useEffect, useState, useCallback, useRef } from 'react';
import axios from 'axios';
import { BiMap } from 'react-icons/bi';
import { FaFilter, FaTimes, FaAngleLeft, FaAngleRight } from 'react-icons/fa'; // Import icons for pagination
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import SidebarFilter from '../components/SidebarFilter';

// --- (useDebounce and TourCard remain the same) ---

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

const TourCard = ({ tour, effectiveBackendUrl, activeCurrency, openDetailModal, t }) => (
  <motion.div
    key={tour._id}
    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    {tour.image ? (
      <img
        src={`${effectiveBackendUrl}${tour.image}`}
        alt={tour.name}
        className="w-full h-48 sm:h-40 object-cover"
        onError={(e) => {
          e.target.src =
            'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
        }}
      />
    ) : (
      <div className="w-full h-48 sm:h-40 bg-gray-200 flex items-center justify-center">
        <span className="text-gray-500 text-sm">{t('toursPage.noImage')}</span>
      </div>
    )}
    <div className="p-6 sm:p-4">
      <h3 className="text-lg font-semibold text-havanaGray">{tour.name}</h3>
      <p className="text-gray-600 mt-2 text-sm">
        {tour.description?.length > 50
          ? `${tour.description.substring(0, 50)}...`
          : tour.description}
      </p>
      <div className="flex justify-between items-center mt-2">
        <p className="text-havanaBlue font-medium">
          {activeCurrency?.code} {tour.price?.toLocaleString()}
        </p>
        <p className="text-gray-600 text-sm">{tour.duration}</p>
      </div>
      {tour.tourType && (
        <div className="mt-2 text-sm text-gray-500 flex items-center justify-end">
          <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
            {tour.tourType}
          </span>
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => openDetailModal(tour, 'tour')}
          className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
        >
          {t('toursPage.seeDetails')}
        </button>
      </div>
    </div>
  </motion.div>
);

// --- (Pagination component) ---

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;

  const maxPagesToShow = 5;
  const startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  const pages = [];

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // Adjust start/end if we are near the totalPages
  if (endPage - startPage + 1 < maxPagesToShow && startPage > 1) {
    const newStart = Math.max(1, endPage - maxPagesToShow + 1);
    pages.length = 0; // Clear the array
    for (let i = newStart; i <= endPage; i++) {
        pages.push(i);
    }
  }

  const PageButton = ({ page, isActive, children }) => (
    <button
      onClick={() => onPageChange(page)}
      className={`px-3 py-1 mx-1 rounded-md transition-colors duration-150 ${
        isActive
          ? 'bg-havanaPink text-white font-bold'
          : 'bg-white text-havanaGray hover:bg-gray-200'
      } disabled:opacity-50`}
      disabled={isActive}
    >
      {children || page}
    </button>
  );

  return (
    <div className="flex justify-center items-center mt-8 space-x-2">
      <PageButton page={currentPage - 1} isActive={false} disabled={currentPage === 1} onPageChange={onPageChange}>
        <FaAngleLeft />
      </PageButton>

      {/* Show first page if not in view */}
      {pages[0] > 1 && (
        <>
          <PageButton page={1} isActive={currentPage === 1} onPageChange={onPageChange} />
          {pages[0] > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {/* Render visible pages */}
      {pages.map((page) => (
        <PageButton key={page} page={page} isActive={currentPage === page} onPageChange={onPageChange} />
      ))}

      {/* Show last page if not in view */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="text-gray-500">...</span>}
          <PageButton page={totalPages} isActive={currentPage === totalPages} onPageChange={onPageChange} />
        </>
      )}

      <PageButton page={currentPage + 1} isActive={false} disabled={currentPage === totalPages} onPageChange={onPageChange}>
        <FaAngleRight />
      </PageButton>
    </div>
  );
};

// --- (Tours component) ---

function Tours({ openDetailModal, activeCurrency }) {
  const { t, i18n } = useTranslation();
  const [tours, setTours] = useState([]);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // 🔹 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // Set your desired items per page

  const [filters, setFilters] = useState({
    search: '',
    languages: '',
    destinations: '',
    minPrice: '',
    maxPrice: '',
    minPax: '',
    maxPax: '',
    tourType: '',
    duration: '',
  });

  const [filterOptions, setFilterOptions] = useState({
    tourTypes: [],
    guideLanguages: [],
    destinations: [],
    durations: [],
  });

  const effectiveBackendUrl = import.meta.env.VITE_API_URL;
  const debouncedFilters = useDebounce(filters, 500);
  const firstRender = useRef(true);

  // 🔹 Fetch tours (Updated to include pagination)
  const fetchData = useCallback(async () => {
    setError('');
    // Scroll to top of results on fetch
    window.scrollTo({ top: 0, behavior: 'smooth' }); 

    try {
      const currentLang = i18n.language || 'en';
      const queryParams = new URLSearchParams({
        // ➡️ Add pagination parameters
        page: currentPage, 
        limit: itemsPerPage,
        // ⬅️ Pagination parameters end
        search: debouncedFilters.search,
        languages: debouncedFilters.languages,
        destinations: debouncedFilters.destinations,
        minPrice: debouncedFilters.minPrice,
        maxPrice: debouncedFilters.maxPrice,
        minPax: debouncedFilters.minPax,
        maxPax: debouncedFilters.maxPax,
        tourType: debouncedFilters.tourType,
        duration: debouncedFilters.duration,
        lang: currentLang,
      }).toString();

      const response = await axios.get(`${effectiveBackendUrl}/api/tours?${queryParams}`);

      if (response.data && Array.isArray(response.data.tours)) {
        setTours(response.data.tours);
        // ➡️ Update total pages from API response
        setTotalPages(response.data.totalPages || 1); 
      } else {
        setTours([]);
        setTotalPages(1); // Reset total pages if no data
      }
    } catch (err) {
      setError(t('toursPage.failedToFetch'));
      console.error('Fetch error:', err.response?.data || err.message);
      setTours([]);
      setTotalPages(1);
    }
  }, [i18n.language, effectiveBackendUrl, debouncedFilters, currentPage, itemsPerPage, t]); // Add currentPage to dependencies

  // 🔹 Fetch filter options (Unchanged)
  useEffect(() => {
    const fetchFilterOptions = async () => {
      try {
        const response = await axios.get(`${effectiveBackendUrl}/api/tours/filters`);
        if (response.data) {
          setFilterOptions({
            tourTypes: response.data.tourTypes || [],
            guideLanguages: response.data.guideLanguages || [],
            destinations: response.data.destinations || [],
            durations: response.data.durations || [],
          });
        }
      } catch (err) {
        console.error('Failed to fetch filter options:', err.response?.data || err.message);
      }
    };

    fetchFilterOptions();
  }, [effectiveBackendUrl]);

  // 🔹 Fetch tours on mount & filter/page change
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      fetchData();
    } else {
      fetchData();
    }
  }, [fetchData]);

  // 🔹 Handle filter change (Reset page to 1 when filters change)
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prevFilters) => ({ ...prevFilters, ...newFilters }));
    setCurrentPage(1); // 💡 Crucial: Reset page on filter change
  }, []);

  // 🔹 Handle page change
  const handlePageChange = useCallback((page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-havanaGray flex items-center">
            <BiMap className="mr-2 text-havanaPink" />
            {t('toursPage.title')}
          </h2>
          <button
            className="bg-havanaPink text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors duration-200 flex items-center"
            onClick={toggleSidebar}
          >
            {isSidebarOpen ? <FaTimes className="mr-2" /> : <FaFilter className="mr-2" />}
            {isSidebarOpen ? t('toursPage.closeFilters') : t('toursPage.allFilters')}
          </button>
        </div>
        
        {/* --- Main Content and Sidebar --- */}
        <div className="flex flex-col lg:flex-row gap-6 relative">
          <SidebarFilter
            type="tours"
            onFilterChange={handleFilterChange}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
            tourTypes={filterOptions.tourTypes}
            ticketTypes={filterOptions.guideLanguages}
            destinations={filterOptions.destinations}
            durations={filterOptions.durations}
          />

          <div className={`flex-grow ${isSidebarOpen ? 'lg:w-3/4' : 'lg:w-full'} relative`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tours.length === 0 && !error ? (
                <p className="text-gray-600 text-center col-span-full">
                  {t('toursPage.noToursFound')}
                </p>
              ) : (
                tours.map((tour) => (
                  <TourCard
                    key={tour._id}
                    tour={tour}
                    effectiveBackendUrl={effectiveBackendUrl}
                    activeCurrency={activeCurrency}
                    openDetailModal={openDetailModal}
                    t={t}
                  />
                ))
              )}
            </div>
            
            {/* ➡️ Pagination Controls */}
            {tours.length > 0 && totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
            {/* ⬅️ Pagination Controls End */}
            
          </div>
        </div>
      </div>
    </div>
  );
}

export default Tours;