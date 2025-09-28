import React, { useState, useEffect } from 'react';
import { BiWalk } from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_API_URL;


function PopularActivities({ activeCurrency, openModal }) {
  const { t, i18n } = useTranslation();
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!BACKEND_URL) {
          throw new Error('VITE_API_URL is not defined.');
        }

        const currentLang = i18n.language || 'en';
        
        const response = await axios.get(`${BACKEND_URL}/api/activities`, {
          params: {
            limit: 3, // Ambil hanya 3 aktivitas populer
            lang: currentLang,
          },
        });
        setActivities(response.data.activities);
      } catch (err) {
        console.error("Failed to fetch popular activities:", err);
        setError("Failed to load activities. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivities();
  }, [i18n.language]);

  if (isLoading) {
    return (
      <section className="mb-16">
        <h2 className="text-3xl font-bold text-havanaGray flex items-center mb-6">
          <BiWalk className="mr-2 text-havanaPink" />
          {t('popularActivities.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-4 animate-pulse">
            <div className="w-full h-40 sm:h-36 bg-gray-300 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-300 w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded-md"></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 animate-pulse hidden sm:block">
            <div className="w-full h-40 sm:h-36 bg-gray-300 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-300 w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded-md"></div>
          </div>
          <div className="bg-white rounded-xl shadow p-4 animate-pulse hidden lg:block">
            <div className="w-full h-40 sm:h-36 bg-gray-300 rounded-lg mb-4"></div>
            <div className="h-6 bg-gray-300 w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 w-1/2 mb-4"></div>
            <div className="h-10 bg-gray-300 rounded-md"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16 text-center text-red-500">
        <h2 className="text-3xl font-bold text-havanaGray flex items-center mb-6">
          <BiWalk className="mr-2 text-havanaPink" />
          {t('popularActivities.title')}
        </h2>
        <p>{t('popularActivities.error')} {error}</p>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-havanaGray flex items-center">
          <BiWalk className="mr-2 text-havanaPink" />
          {t('popularActivities.title')}
        </h2>
        <a href="/activities" className="text-havanaBlue hover:underline text-sm font-medium">
          {t('popularActivities.viewAll')}
        </a>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
        {activities.map((activity, i) => (
          <motion.div
            key={activity._id}
            className="bg-white rounded-xl shadow hover:shadow-xl transition-shadow duration-300 overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            viewport={{ once: true }}
            onClick={() => openModal(activity, 'activity')}
          >
            <div className="relative w-full h-40 sm:h-36 overflow-hidden">
              {activity.image ? (
                <img
                  src={`${BACKEND_URL}${activity.image}`}
                  alt={activity.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.src = 'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">{t('popularActivities.noImage')}</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <h3 className="text-md font-semibold text-havanaGray flex items-center mb-1">
                <BiWalk className="mr-2 text-havanaPink" />
                {activity.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {activity.description?.length > 80
                  ? `${activity.description.substring(0, 80)}...`
                  : activity.description}
              </p>

              <div className="flex justify-between items-center mt-3 text-sm">
                <p className="text-havanaBlue font-semibold">
                  {activeCurrency.code} {activity.price?.toLocaleString()}
                </p>
              </div>

              {activity.category && (
                <div className="mt-2 text-sm text-gray-500 flex items-center justify-end">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {activity.category.name || activity.category}
                  </span>
                </div>
              )}

              <div className="mt-4 flex justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openModal(activity, 'activity');
                  }}
                  className="bg-havanaBlue text-white py-2 px-4 rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors duration-200"
                >
                  {t('popularActivities.seeDetail')}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export default PopularActivities;
