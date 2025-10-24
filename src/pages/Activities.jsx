import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { BiWalk } from "react-icons/bi";
import { FaFilter, FaTimes } from "react-icons/fa";
import SidebarFilter from "../components/SidebarFilter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion"; // ✅ Tambahkan ini

function Activities({
  openDetailModal,
  activeCurrency,
  BACKEND_URL: appBackendUrl,
  user,
  token,
}) {
  const [activities, setActivities] = useState([]);
  const [filteredActivities, setFilteredActivities] = useState([]);
  const [error, setError] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const { t, i18n } = useTranslation();

  // ✅ Pastikan URL sudah benar
  const effectiveBackendUrl = import.meta.env.VITE_API_URL;

  // 🔹 Ambil semua aktivitas dari backend
  const fetchActivities = useCallback(async () => {
    try {
      const currentLang = i18n.language || "en";
      const response = await axios.get(`${effectiveBackendUrl}/api/activities?lang=${currentLang}`);

      console.log("🌍 Fetching from:", `${effectiveBackendUrl}/activities`);
      console.log("📦 Raw API response:", response.data);

      // Pastikan selalu dapat array
      const activitiesArray =
        Array.isArray(response.data?.activities)
          ? response.data.activities
          : Array.isArray(response.data)
          ? response.data
          : [];

      console.log("✅ Parsed activities:", activitiesArray.length);

      const validActivities = activitiesArray.filter(
        (activity) =>
          activity.description?.length <= 3000 &&
          activity.pax >= 1 &&
          activity.pax <= 10
      );

      setActivities(validActivities);
      setFilteredActivities(validActivities);
    } catch (err) {
      console.error("❌ Activity fetch error:", err);
      setError(t("activities.loadingError"));
    }
  }, [effectiveBackendUrl, t, i18n.language]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // 🔹 Handle filter dari SidebarFilter
  const handleFilterChange = useCallback(
    (filters) => {
      console.log("🎛️ Filter applied:", filters);
      let filtered = activities;

      if (filters.search) {
        filtered = filtered.filter((activity) =>
          activity.name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.category) {
        filtered = filtered.filter(
          (activity) =>
            activity.category?._id === filters.category ||
            activity.category === filters.category
        );
      }

      if (
        filters.minPrice !== undefined &&
        filters.maxPrice !== undefined &&
        filters.minPrice !== null
      ) {
        filtered = filtered.filter(
          (activity) =>
            activity.price >= filters.minPrice &&
            activity.price <= filters.maxPrice
        );
      }

      if (filters.duration) {
        filtered = filtered.filter(
          (activity) => activity.duration === filters.duration
        );
      }

      console.log("🎯 Filtered result:", filtered.map((a) => a.name));
      setFilteredActivities(filtered);
    },
    [activities]
  );

  return (
    <div className="min-h-screen bg-gray-100 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Notification */}
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        <div className="flex flex-col">
          {/* Sidebar Filter */}
          <SidebarFilter
            type="activity"
            onFilterChange={handleFilterChange}
            isOpen={isSidebarOpen}
            setIsOpen={setIsSidebarOpen}
          />

          {/* Header & Toggle Button */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-havanaGray flex items-center">
              <BiWalk className="mr-2 text-havanaPink" />
              {t("activities.title")}
            </h2>
            <button
              className="bg-havanaPink text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors duration-200 flex items-center"
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            >
              {isSidebarOpen ? <FaTimes className="mr-2" /> : <FaFilter className="mr-2" />}
              {isSidebarOpen
                ? t("activities.closeFilters")
                : t("activities.allFilters")}
            </button>
          </div>

          {/* List of Activities */}
          {filteredActivities.length === 0 ? (
            <p className="text-gray-600 text-center">
              {t("activities.noMatch")}
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredActivities.map((activity) => (
                <motion.div
                  key={activity._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {activity.image ? (
                    <img
                      src={`${effectiveBackendUrl}${activity.image}`}
                      alt={activity.name}
                      className="w-full h-48 sm:h-40 object-cover"
                      onError={(e) => {
                        e.target.src =
                          "https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg";
                      }}
                    />
                  ) : (
                    <div className="w-full h-48 sm:h-40 bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">
                        {t("activities.noImage")}
                      </span>
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
                        {activeCurrency.code}{" "}
                        {activity.price.toLocaleString()} /{" "}
                        {t("activities.pax", { count: activity.pax })}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {activity.duration || "N/A"}
                      </p>
                    </div>

                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openDetailModal(activity, "activity")}
                        className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                      >
                        {t("activities.seeDetails")}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Activities;
