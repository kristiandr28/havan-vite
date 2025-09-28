import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BiWalk } from 'react-icons/bi';
import { FaFilter, FaTimes } from 'react-icons/fa';
import SidebarFilter from '../components/SidebarFilter';
import { useTranslation } from 'react-i18next'; // Import useTranslation

function Activities({ openDetailModal, activeCurrency, BACKEND_URL: appBackendUrl, user, token }) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Use the hook to get the translation function 't'
  const { t } = useTranslation(); 

  const effectiveBackendUrl = import.meta.env.VITE_API_URL;

  const fetchActivities = useCallback(async () => {
    try {
      const [activitiesResponse, categoriesResponse] = await Promise.all([
        axios.get(`${effectiveBackendUrl}/api/activities`),
        axios.get(`${effectiveBackendUrl}/api/categories`),
      ]);

      const activitiesArray = Array.isArray(activitiesResponse.data.activities) ? activitiesResponse.data.activities : [];

      const validActivities = activitiesArray.filter(
        (activity) =>
          activity.description?.length <= 3000 &&
          activity.description?.split('.').filter((s) => s.trim()).length <= 3 &&
          activity.pax >= 1 &&
          activity.pax <= 10
      );
      const invalidActivities = activitiesArray.filter(
        (activity) =>
          activity.description?.length > 3000 ||
          activity.description?.split('.').filter((s) => s.trim()).length > 3 ||
          activity.pax < 1 ||
          activity.pax > 10
      );
      console.log('Valid activities:', validActivities.map((a) => ({ _id: a._id, name: a.name })));
      if (invalidActivities.length > 0) {
        console.log(
          'Invalid activities:',
          invalidActivities.map((a) => ({
            _id: a._id,
            name: a.name,
            descriptionLength: a.description?.length,
            pax: a.pax,
          }))
        );
        // Use t() with the new key and interpolation
        setError(t('activities.errorInvalidData', { count: invalidActivities.length }));
      }
      setActivities(validActivities);
      setFilteredActivities(validActivities);
      setCategories(categoriesResponse.data);
    } catch (err) {
      // Use t() for the new key
      setError(t('activities.loadingError'));
      console.error('Activity fetch error:', err);
    }
  }, [effectiveBackendUrl, t]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleFilterChange = useCallback(({ searchTerm, category, priceRange, duration }) => {
    let filtered = activities;

    if (searchTerm) {
      filtered = filtered.filter((activity) =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (category) {
      filtered = filtered.filter((activity) =>
        activity.categories?.some((cat) => cat._id === category)
      );
    }

    if (priceRange) {
      const [min, max] = priceRange.split('-').map((val) => (val ? parseInt(val) : Infinity));
      filtered = filtered.filter((activity) =>
        activity.price >= (min || 0) && activity.price <= (max || Infinity)
      );
    }

    if (duration) {
      const [minHours, maxHours] = duration.split('-').map((val) => (val ? parseInt(val) : Infinity));
      filtered = filtered.filter((activity) =>
        parseInt(activity.duration) >= (minHours || 0) && parseInt(activity.duration) <= (maxHours || Infinity)
      );
    }

    setFilteredActivities(filtered);
  }, [activities]);

  const activityDurations = [
    // Use the new nested keys
    { label: t('activities.duration_label'), value: '' },
    { label: t('activities.duration_under_3'), value: '0-3' },
    { label: t('activities.duration_3_to_6'), value: '3-6' },
    { label: t('activities.duration_over_6'), value: '6-' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
        <div className="flex flex-col">
          <div className={`w-full ${isSidebarOpen ? 'block' : 'hidden'}`}>
            <SidebarFilter
              type="activities"
              onFilterChange={handleFilterChange}
              categories={categories}
              isOpen={isSidebarOpen}
              setIsOpen={setIsSidebarOpen}
              durations={activityDurations}
            />
          </div>

          <div className="flex-grow">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-havanaGray flex items-center">
                <BiWalk className="mr-2 text-havanaPink" />
                {/* Use the new key */}
                {t('activities.title')} 
              </h2>
              <button
                className="bg-havanaPink text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors duration-200 flex items-center"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? <FaTimes className="mr-2" /> : <FaFilter className="mr-2" />}
                {/* Use the new keys */}
                {isSidebarOpen ? t('activities.closeFilters') : t('activities.allFilters')}
              </button>
            </div>

            {filteredActivities.length === 0 ? (
              // Use the new key
              <p className="text-gray-600 text-center">{t('activities.noMatch')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredActivities.map((activity) => (
                  <div
                    key={activity._id}
                    className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  >
                    {activity.image ? (
                      <img
                        src={`${effectiveBackendUrl}${activity.image}`}
                        alt={activity.name}
                        className="w-full h-48 sm:h-40 object-cover"
                        onError={(e) => {
                          console.error(`Image loading error for ${activity.name}:`, `${effectiveBackendUrl}${activity.image}`);
                          e.target.src = 'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-full h-48 sm:h-40 bg-gray-200 flex items-center justify-center">
                        {/* Use the new key */}
                        <span className="text-gray-500 text-sm">{t('activities.noImage')}</span>
                      </div>
                    )}
                    <div className="p-6 sm:p-4">
                      <h3 className="text-lg font-semibold text-havanaGray flex items-center">
                        <BiWalk className="mr-2 text-havanaPink" />
                        {activity.name}
                      </h3>
                      <p className="text-gray-600 mt-2 text-sm">
                        {activity.description.length > 100
                          ? `${activity.description.substring(0, 100)}...`
                          : activity.description}
                      </p>
                      <div className="flex justify-between items-center mt-2">
                        <p className="text-havanaBlue font-medium">
                          {activeCurrency.code} {activity.price.toLocaleString()} / {t('activities.pax', { count: activity.pax })}
                        </p>
                        <p className="text-gray-600 text-sm">{activity.duration || 'N/A'}</p>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          onClick={() => openDetailModal(activity, 'activity')}
                          className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                        >
                          {/* Use the new key */}
                          {t('activities.seeDetails')}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Activities;