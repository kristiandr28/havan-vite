import React, { useState, useEffect } from 'react';
import { BiMap } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import TooltipPortal from './TooltipPortal'; // Import Tooltip

const BACKEND_URL = import.meta.env.VITE_API_URL;

function FeaturedTours({ activeCurrency, openModal }) {
  const { t, i18n } = useTranslation();
  const [tours, setTours] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredTitle, setHoveredTitle] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const fetchTours = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!BACKEND_URL) {
          throw new Error('VITE_API_URL is not defined.');
        }

        const currentLang = i18n.language || 'en';
        const response = await fetch(`${BACKEND_URL}/api/tours?limit=4&lang=${currentLang}`);

        if (!response.ok) {
          throw new Error('Failed to fetch tours.');
        }

        const data = await response.json();
        setTours(data.tours);
      } catch (err) {
        console.error('Error fetching featured tours:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTours();
  }, [i18n.language]);

  if (isLoading) {
    return (
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-havanaGray flex items-center mb-6">
          <BiMap className="mr-2 text-havanaPink" />
          {t('featuredTours.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`bg-white rounded-xl shadow p-4 animate-pulse ${
                i > 1 ? 'hidden sm:block' : ''
              } ${i > 2 ? 'hidden lg:block' : ''} ${i > 3 ? 'hidden xl:block' : ''}`}
            >
              <div className="w-full h-40 bg-gray-300 rounded-lg mb-4"></div>
              <div className="h-6 bg-gray-300 w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-300 w-1/2 mb-4"></div>
              <div className="h-10 bg-gray-300 rounded-md"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16 text-center text-red-500">
        <p>Error: {error}</p>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-havanaGray flex items-center">
          <BiMap className="mr-2 text-havanaPink" />
          {t('featuredTours.title')}
        </h2>
        <a href="/tours" className="text-havanaBlue hover:underline text-sm font-medium">
          {t('featuredTours.viewAll')}
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
        {tours.map((tour, i) => (
          <motion.div
          key={tour._id}
          className="bg-white rounded-xl shadow-sm transition-all duration-200 overflow-hidden group cursor-default
                    hover:bg-gray-50 hover:shadow-md"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.1 }}
          viewport={{ once: true }}
          >
            <div className="relative w-full h-40 sm:h-36 overflow-hidden">
              {tour.image ? (
                <img
                  src={`${BACKEND_URL}${tour.image}`}
                  alt={tour.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src =
                      'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">{t('featuredTours.noImage')}</span>
                </div>
              )}
            </div>

            <div className="p-4 relative">
              <h3
                className="text-md font-semibold text-havanaGray flex items-center mb-1 overflow-hidden"
                onMouseEnter={(e) => {
                  const rect = e.target.getBoundingClientRect();
                  setTooltipPosition({
                    top: rect.top - 30,
                    left: rect.left,
                  });
                  setHoveredTitle(tour._id);
                }}
                onMouseLeave={() => setHoveredTitle(null)}
              >
                <BiMap className="mr-2 text-havanaPink flex-shrink-0" />
                <span className="truncate">{tour.name}</span>
              </h3>

              <p className="text-gray-600 text-sm">
                {tour.description?.length > 80
                  ? `${tour.description.substring(0, 80)}...`
                  : tour.description}
              </p>

              <div className="flex justify-between items-center mt-3 text-sm">
                <p className="text-havanaBlue font-semibold">
                  {activeCurrency?.code} {tour.price?.toLocaleString()}
                </p>
                <span className="text-gray-500">{tour.duration || t('featuredTours.na')}</span>
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
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(tour, 'tour');
                  }}
                  className="bg-havanaBlue text-white py-2 px-4 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  {t('featuredTours.seeDetail')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tooltip Portal Render */}
      {hoveredTitle && (
        <TooltipPortal position={tooltipPosition}>
          {tours.find((tour) => tour._id === hoveredTitle)?.name}
        </TooltipPortal>
      )}
    </section>
  );
}

export default FeaturedTours;
