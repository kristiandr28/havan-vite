import React, { useState, useEffect } from 'react';
import { BiPin } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

const BACKEND_URL = import.meta.env.VITE_API_URL;

// 🔹 Helper untuk translasi fallback
// 👇 Tambahkan fungsi helper ini di backend
function getTranslation(translations, langCode = 'en') {
  const lowerLang = langCode.toLowerCase();
  const exactMatch = translations.find(t => t.language?.code?.toLowerCase() === lowerLang);
  if (exactMatch) return exactMatch;

  const prefixMatch = translations.find(t => 
    t.language?.code?.toLowerCase().startsWith(lowerLang)
  );
  if (prefixMatch) return prefixMatch;

  const fallback = translations.find(t => t.language?.code?.toLowerCase() === 'en');
  return fallback || translations[0];
}


function FeaturedDestinations({ openModal }) {
  const { t, i18n } = useTranslation();
  const [destinations, setDestinations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDestinations = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!BACKEND_URL) {
          throw new Error('REACT_APP_BACKEND_URL is not defined');
        }

        const currentLang = i18n.language || 'en';

        const response = await fetch(`${BACKEND_URL}/api/destinations?lang=${currentLang}`);
        if (!response.ok) {
          throw new Error('Failed to fetch destinations');
        }

        const data = await response.json();
        setDestinations(data);
      } catch (err) {
        console.error('Error fetching destinations:', err);
        setError(err.message || 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDestinations();
  }, [i18n.language]);

  if (isLoading) {
    return (
      <section className="mb-12">
        <div className="text-center text-havanaGray p-8 animate-pulse">
          {t('general.loading')}...
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-12 text-center text-red-500">
        <p>Error: {error}</p>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-havanaGray flex items-center">
          <BiPin className="mr-2 text-havanaPink" />
          {t('featuredDestinations.title')}
        </h2>
        <a
          href="/destinations"
          className="text-sm text-havanaBlue hover:underline flex items-center"
        >
          {t('featuredDestinations.viewAll')}
        </a>
      </div>

      <Swiper
        modules={[Navigation, Autoplay]}
        navigation
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        spaceBetween={12}
        breakpoints={{
          0: { slidesPerView: 2 },
          640: { slidesPerView: 3 },
          1024: { slidesPerView: 5 },
        }}
      >
        {destinations.map(destination => {
          // Translations
          const destTrans = getTranslation(destination.translations, i18n.language, 'en');
          const locationName = destination?.location?.name || t('featuredDestinations.noLocation');

          return (
            <SwiperSlide key={destination._id}>
              <div className="bg-white rounded-md shadow-md overflow-hidden hover:shadow-md transition duration-200 text-sm">
                {destination.image ? (
                  <img
                    src={`${BACKEND_URL}${destination.image}`}
                    alt={destTrans?.name || 'Destination'}
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.target.src = 'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                    }}
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500 text-xs">
                      {t('featuredDestinations.noImage')}
                    </span>
                  </div>
                )}

                <div className="p-3">
                  <h3 className="font-semibold text-havanaGray flex items-center text-sm">
                    <BiPin className="mr-1 text-havanaPink text-base" />
                    {destTrans?.name || 'No Name'}
                  </h3>

                  <p className="text-gray-600 mt-1 line-clamp-2 text-xs">
                    {destTrans?.description?.length > 80
                      ? `${destTrans.description.substring(0, 80)}...`
                      : destTrans?.description || t('featuredDestinations.noDescription')}
                  </p>

                  <div className="flex justify-between items-center mt-2">
                    <p className="text-havanaBlue font-medium text-xs">
                      {locationName}
                    </p>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <button
                      onClick={() => openModal(destination, 'destination')}
                      className="bg-havanaBlue text-white py-1 px-3 rounded text-xs hover:bg-blue-700"
                    >
                      {t('featuredDestinations.detail')}
                    </button>
                  </div>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </section>
  );
}

export default FeaturedDestinations;
