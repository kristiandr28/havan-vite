import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BiPin } from 'react-icons/bi';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import DetailModal from './components/DetailModal';
import ImageModal from './components/ImageModal';

// --- Pagination component ---
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

  const PageButton = ({ page, isActive, disabled, children }) => (
    <button
      onClick={() => onPageChange(page)}
      className={`px-3 py-1 mx-1 rounded-md transition-colors duration-150 ${
        isActive
          ? 'bg-havanaPink text-white font-bold'
          : 'bg-white text-havanaGray hover:bg-gray-200'
      } disabled:opacity-50`}
      disabled={disabled || isActive}
    >
      {children || page}
    </button>
  );

  return (
    <div className="flex justify-center items-center mt-8 space-x-2">
      <PageButton
        page={currentPage - 1}
        disabled={currentPage === 1}
      >
        <FaAngleLeft />
      </PageButton>

      {/* Show first page if not in view */}
      {pages[0] > 1 && (
        <>
          <PageButton page={1} isActive={currentPage === 1} />
          {pages[0] > 2 && <span className="text-gray-500">...</span>}
        </>
      )}

      {/* Render visible pages */}
      {pages.map((page) => (
        <PageButton
          key={page}
          page={page}
          isActive={currentPage === page}
        />
      ))}

      {/* Show last page if not in view */}
      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && (
            <span className="text-gray-500">...</span>
          )}
          <PageButton
            page={totalPages}
            isActive={currentPage === totalPages}
          />
        </>
      )}

      <PageButton
        page={currentPage + 1}
        disabled={currentPage === totalPages}
      >
        <FaAngleRight />
      </PageButton>
    </div>
  );
};

// --- Destinations component ---
function Destinations() {
  const [destinations, setDestinations] = useState([]);
  const [error, setError] = useState('');
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  const BACKEND_URL = import.meta.env.VITE_API_URL;
  const { t, i18n } = useTranslation();

  // 🔹 Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 6; // tampilkan 6 destinasi per halaman

  const fetchDestinations = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/destinations/filter`, {
        params: {
          lang: i18n.language || 'en',
          page: currentPage,
          limit: itemsPerPage,
        },
      });

      if (response.data && Array.isArray(response.data.destinations)) {
        setDestinations(response.data.destinations);
        setTotalPages(response.data.totalPages || 1);
      } else {
        // fallback kalau backend belum support pagination
        setDestinations(response.data || []);
        setTotalPages(1);
      }
    } catch (err) {
      setError(t('destinations.loadingError'));
      console.error('Fetch destinations error:', err);
      setDestinations([]);
      setTotalPages(1);
    }
  }, [BACKEND_URL, i18n.language, currentPage, itemsPerPage, t]);

  useEffect(() => {
    fetchDestinations();
  }, [fetchDestinations]);

  const modalHandlers = {
    openModal: (destination) => setSelectedDestination(destination),
    closeModal: () => setSelectedDestination(null),
    openImageModal: (image) => setSelectedImage(image),
    closeImageModal: () => setSelectedImage(null),
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <h2 className="text-3xl font-bold text-havanaGray mb-6 flex items-center">
          <BiPin className="mr-2 text-havanaPink" />
          {t('destinations.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {destinations.map((destination) => (
            <div
              key={destination._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {destination.image ? (
                <img
                  src={`${BACKEND_URL}${destination.image}`}
                  alt={destination.name}
                  className="w-full h-48 sm:h-40 object-cover"
                  onError={(e) => {
                    e.target.src =
                      'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-48 sm:h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">
                    {t('destinations.noImage')}
                  </span>
                </div>
              )}
              <div className="p-6 sm:p-4">
                <h3 className="text-lg font-semibold text-havanaGray flex items-center">
                  <BiPin className="mr-2 text-havanaPink" />
                  {destination.name}
                </h3>
                <p className="text-gray-600 mt-2">
                  {destination.description?.length > 50
                    ? `${destination.description.substring(0, 50)}...`
                    : destination.description}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-havanaBlue font-medium">
                    {destination.location?.name ||
                      t('destinations.unknownLocation')}
                  </p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => modalHandlers.openModal(destination)}
                    className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    {t('destinations.seeDetails')}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 🔹 Pagination Controls */}
        {destinations.length > 0 && totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        <DetailModal
          isOpen={!!selectedDestination}
          closeModal={modalHandlers.closeModal}
          selectedItem={selectedDestination}
          modalType="destination"
          activeCurrency={null}
          openItineraryModal={() => {}}
          openImageModal={modalHandlers.openImageModal}
          isFromBookingModal={false}
          descriptionError=""
          BACKEND_URL={BACKEND_URL}
        />
        <ImageModal
          isOpen={!!selectedImage}
          closeModal={modalHandlers.closeImageModal}
          selectedImage={selectedImage}
        />
      </div>
    </div>
  );
}

export default Destinations;
