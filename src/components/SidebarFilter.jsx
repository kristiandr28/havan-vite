import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function SidebarFilter({ onFilterChange, isOpen, setIsOpen, type = "tour" }) {
  const { i18n } = useTranslation();

  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    category: "",
    tourType: "",
    guideLanguage: "",
    destination: "",
    price: [0, 10000000],
    duration: "",
  });

  const [categories, setCategories] = useState([]);
  const [tourTypes, setTourTypes] = useState([]);
  const [durations, setDurations] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 10000000]);

  // 🔹 Fetch filter data (Tour / Activity)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const currentLang = i18n.language || "en";
        const endpoint =
          type === "activity"
            ? `${API_URL}/api/activities/filters?lang=${currentLang}`
            : `${API_URL}/api/tours/filters?lang=${currentLang}`;

        console.log("🌍 Fetching filter data from:", endpoint);
        const res = await fetch(endpoint);
        const data = await res.json();

        console.log("📦 Raw filter data:", data);

        // ✅ Normalize response
        const filterData = data.data || data;

        if (type === "activity") {
          setCategories(filterData.categories || []);
          setLanguages(filterData.guideLanguages || []);
        } else {
          // Tour filters
          setTourTypes(
            filterData.tourTypes?.length
              ? filterData.tourTypes
              : [
                  { label: "Full Day", value: "Full Day" },
                  { label: "Half Day", value: "Half Day" },
                  { label: "Multi Day", value: "Multi Day" },
                ]
          );
          setDestinations(
            filterData.destinations?.length
              ? filterData.destinations
              : [{ label: "All Destinations", value: "" }]
          );
          setLanguages(filterData.guideLanguages || []);
        }

        setDurations(
          (filterData.durations || []).map((d) =>
            typeof d === "string" ? { label: d, value: d } : d
          )
        );

        if (filterData.priceRange)
          setPriceRange([
            filterData.priceRange.min,
            filterData.priceRange.max,
          ]);
      } catch (err) {
        console.error("❌ Failed to fetch filters:", err);
        alert("Failed to load filter options. Please check your connection.");
      }
    };

    fetchFilters();
  }, [i18n.language, type]);

  // 🔹 Handle filter change → send to parent
  useEffect(() => {
    const queryFilters = {};

    if (searchTerm) queryFilters.search = searchTerm;

    if (type === "tour" && filters.tourType)
      queryFilters.tourType = filters.tourType;
    if (type === "tour" && filters.destination)
      queryFilters.destination = filters.destination;
    if (type === "activity" && filters.category)
      queryFilters.category = filters.category;

    if (filters.guideLanguage)
      queryFilters.language = filters.guideLanguage;
    if (filters.duration) queryFilters.duration = filters.duration;

    if (filters.price) {
      queryFilters.minPrice = filters.price[0];
      queryFilters.maxPrice = filters.price[1];
    }

    onFilterChange(queryFilters);
  }, [searchTerm, filters, onFilterChange, type]);

  // 🔹 Handlers
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    if (value === "") onFilterChange({});
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    const defaultFilters = {
      category: "",
      tourType: "",
      guideLanguage: "",
      destination: "",
      price: [priceRange[0], priceRange[1]],
      duration: "",
    };
    setFilters(defaultFilters);
    onFilterChange({});
  };

  // 🔹 UI
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 100 }}
          className="fixed top-0 right-0 h-full w-80 bg-white shadow-lg p-5 z-50 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">
              {type === "activity" ? "Activity Filters" : "Tour Filters"}
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-600 hover:text-gray-800"
            >
              <FaTimes />
            </button>
          </div>

          {/* Search */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">Search</label>
            <div className="flex items-center border rounded-lg p-2">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none text-sm"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Category (Activity only) */}
          {type === "activity" && (
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tour Type (Tour only) */}
          {type === "tour" && (
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">
                Tour Type
              </label>
              <select
                value={filters.tourType}
                onChange={(e) =>
                  handleFilterChange("tourType", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">All</option>
                {tourTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Destination (Tour only) */}
          {type === "tour" && (
            <div className="mb-5">
              <label className="block text-sm font-semibold mb-2">
                Destination
              </label>
              <select
                value={filters.destination}
                onChange={(e) =>
                  handleFilterChange("destination", e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">All</option>
                {destinations.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Guide Language */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">
              Guide Language
            </label>
            <select
              value={filters.guideLanguage}
              onChange={(e) =>
                handleFilterChange("guideLanguage", e.target.value)
              }
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">All</option>
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">Duration</label>
            <select
              value={filters.duration}
              onChange={(e) => handleFilterChange("duration", e.target.value)}
              className="w-full border rounded-lg p-2 text-sm"
            >
              <option value="">All</option>
              {durations.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="mb-5">
            <label className="block text-sm font-semibold mb-2">
              Price Range (Rp {filters.price[0].toLocaleString()} - Rp{" "}
              {filters.price[1].toLocaleString()})
            </label>

            <input
              type="range"
              min={priceRange[0]}
              max={priceRange[1]}
              step="50000"
              value={filters.price[0]}
              onChange={(e) =>
                handleFilterChange("price", [
                  Number(e.target.value),
                  filters.price[1],
                ])
              }
              className="w-full mb-2"
            />

            <input
              type="range"
              min={priceRange[0]}
              max={priceRange[1]}
              step="50000"
              value={filters.price[1]}
              onChange={(e) =>
                handleFilterChange("price", [
                  filters.price[0],
                  Number(e.target.value),
                ])
              }
              className="w-full"
            />
          </div>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="w-full bg-gray-100 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            Reset Filters
          </button>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default SidebarFilter;
