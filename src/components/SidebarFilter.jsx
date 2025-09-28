import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaSearch, FaTimes } from "react-icons/fa";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

function SidebarFilter({ onFilterChange, isOpen, setIsOpen }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    tourType: "",
    guideLanguage: "",
    destination: "",
    price: [0, 10000000],
    duration: "",
  });

  const [tourTypes, setTourTypes] = useState([]);
  const [durations, setDurations] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [languages, setLanguages] = useState([]);

  // 🔹 Fetch filter data dari backend
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await fetch(`${API_URL}/tours/filters`);
        const data = await res.json();
        setTourTypes(data.tourTypes || []);
        setDurations(data.durations || []);
        setDestinations(data.destinations || []);
        setLanguages(data.guideLanguages || []);
      } catch (err) {
        console.error("Failed to fetch filters:", err);
      }
    };
    fetchFilters();
  }, []);

  // 🔹 Mapping filter ke query
  useEffect(() => {
    const queryFilters = {};

    if (searchTerm) queryFilters.search = searchTerm;
    if (filters.tourType) queryFilters.tourType = filters.tourType;
    if (filters.guideLanguage) queryFilters.languages = filters.guideLanguage; // ✅ disesuaikan ke backend
    if (filters.destination) queryFilters.destinations = filters.destination; // ✅ disesuaikan ke backend
    if (filters.price) {
      queryFilters.minPrice = filters.price[0];
      queryFilters.maxPrice = filters.price[1];
    }
    if (filters.duration) queryFilters.duration = filters.duration;

    onFilterChange(queryFilters);
  }, [searchTerm, filters, onFilterChange]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 100 }}
          className="fixed top-0 right-0 h-full w-72 bg-white shadow-lg p-4 z-50 overflow-y-auto"
        >
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => setIsOpen(false)} className="text-gray-600">
              <FaTimes />
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Search</label>
            <div className="flex items-center border rounded p-2">
              <FaSearch className="text-gray-400 mr-2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full outline-none"
                placeholder="Search..."
              />
            </div>
          </div>

          {/* Tour Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Tour Type</label>
            <select
              value={filters.tourType}
              onChange={(e) => handleFilterChange("tourType", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All</option>
              {tourTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Guide Language */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Guide Language</label>
            <select
              value={filters.guideLanguage}
              onChange={(e) => handleFilterChange("guideLanguage", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All</option>
              {languages.map((lang) => (
                <option key={lang._id} value={lang._id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Destination */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Destination</label>
            <select
              value={filters.destination}
              onChange={(e) => handleFilterChange("destination", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All</option>
              {destinations.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Price Range (Rp {filters.price[0]} - Rp {filters.price[1]})
            </label>
            <input
              type="range"
              min="0"
              max="10000000"
              step="500000"
              value={filters.price[0]}
              onChange={(e) =>
                handleFilterChange("price", [Number(e.target.value), filters.price[1]])
              }
              className="w-full mb-2"
            />
            <input
              type="range"
              min="0"
              max="10000000"
              step="500000"
              value={filters.price[1]}
              onChange={(e) =>
                handleFilterChange("price", [filters.price[0], Number(e.target.value)])
              }
              className="w-full"
            />
          </div>

          {/* Duration */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Duration</label>
            <select
              value={filters.duration}
              onChange={(e) => handleFilterChange("duration", e.target.value)}
              className="w-full border rounded p-2"
            >
              <option value="">All</option>
              {durations.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

export default SidebarFilter;
