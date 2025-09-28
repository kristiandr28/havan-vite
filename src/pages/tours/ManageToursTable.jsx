import { BiPlus, BiEdit, BiTrash, BiSearch } from 'react-icons/bi';
import Select from 'react-select';
import React, { useCallback, useEffect } from 'react';

function ManageToursTable({
  tours,
  searchTerm,
  setSearchTerm,
  selectedLanguages,
  setSelectedLanguages,
  selectedDestinations,
  setSelectedDestinations,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  selectedMaxPax,
  setSelectedMaxPax,
  languageOptions,
  destinationOptions,
  maxPaxOptions,
  onPageChange,
  currentPage,
  totalPages,
  totalResults,
  onAddTour,
  onEditTour,
  onDeleteTour,
  BACKEND_URL,
}) {
  const handleSearchChange = useCallback((e) => {
    setSearchTerm(e.target.value);
    onPageChange(1);
  }, [setSearchTerm, onPageChange]);

  const handleFilterLanguageChange = useCallback((selected) => {
    setSelectedLanguages(selected ? selected.map(option => option.value) : []);
    onPageChange(1);
  }, [setSelectedLanguages, onPageChange]);

  const handleFilterDestinationChange = useCallback((selected) => {
    setSelectedDestinations(selected ? selected.map(option => option.value) : []);
    onPageChange(1);
  }, [setSelectedDestinations, onPageChange]);

  const handleMinPriceChange = useCallback((e) => {
    setMinPrice(e.target.value);
    onPageChange(1);
  }, [setMinPrice, onPageChange]);

  const handleMaxPriceChange = useCallback((e) => {
    setMaxPrice(e.target.value);
    onPageChange(1);
  }, [setMaxPrice, onPageChange]);

  const handleFilterMaxPaxChange = useCallback((selected) => {
    setSelectedMaxPax(selected ? selected.value : '');
    onPageChange(1);
  }, [setSelectedMaxPax, onPageChange]);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-2 sm:mb-0">Manage Tours</h3>
        <button
          onClick={onAddTour}
          className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 text-sm sm:text-base transition"
        >
          <BiPlus className="mr-1" />
          Add Tour
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search by Name/Description</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="focus:ring-havanaBlue focus:border-havanaBlue block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search tours..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="col-span-1">
          <label htmlFor="filterLanguages" className="block text-sm font-medium text-gray-700">Filter by Languages</label>
          <Select
            id="filterLanguages"
            isMulti
            options={languageOptions}
            value={languageOptions.filter(option => selectedLanguages.includes(option.value))}
            onChange={handleFilterLanguageChange}
            className="mt-1 text-sm sm:text-base"
            placeholder="Select languages..."
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="filterDestinations" className="block text-sm font-medium text-gray-700">Filter by Destinations</label>
          <Select
            id="filterDestinations"
            isMulti
            options={destinationOptions}
            value={destinationOptions.filter(option => selectedDestinations.includes(option.value))}
            onChange={handleFilterDestinationChange}
            className="mt-1 text-sm sm:text-base"
            placeholder="Select destinations..."
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="filterMaxPax" className="block text-sm font-medium text-gray-700">Filter by Max Pax</label>
          <Select
            id="filterMaxPax"
            options={[{ value: '', label: 'All' }, ...maxPaxOptions]}
            value={[{ value: '', label: 'All' }, ...maxPaxOptions].find(option => option.value === selectedMaxPax)}
            onChange={handleFilterMaxPaxChange}
            className="mt-1 text-sm sm:text-base"
            placeholder="Select max pax..."
            isClearable={true}
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">Min Price</label>
          <input
            type="number"
            name="minPrice"
            id="minPrice"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
            placeholder="e.g., 100000"
            value={minPrice}
            onChange={handleMinPriceChange}
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">Max Price</label>
          <input
            type="number"
            name="maxPrice"
            id="maxPrice"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
            placeholder="e.g., 500000"
            value={maxPrice}
            onChange={handleMaxPriceChange}
          />
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">Image</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Price</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Languages</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Destinations</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Max Pax</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Tour Type</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tours.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-4 text-center text-sm text-gray-500">
                  No tours found.
                </td>
              </tr>
            ) : (
              tours.map((tour) => (
                <tr key={tour._id}>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {tour.image ? (
                      <img src={`${BACKEND_URL}${tour.image}`} alt={tour.name} className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded" />
                    ) : (
                      <span className="text-xs sm:text-sm">No Image</span>
                    )}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tour.name}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">Rp {(tour.price || 0).toLocaleString()}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{(tour.guideLanguages || []).map(lang => lang.name).join(', ')}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{(tour.destinations || []).map(dest => dest.name).join(', ')}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{tour.maxPax != null ? tour.maxPax : 'N/A'}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{tour.tourType || 'N/A'}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onEditTour(tour)} className="text-havanaBlue hover:text-blue-700 mr-2 sm:mr-4 text-base sm:text-lg transition"><BiEdit /></button>
                    <button onClick={() => onDeleteTour(tour)} className="text-red-500 hover:text-red-700 text-base sm:text-lg transition"><BiTrash /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition">Previous</button>
          <span className="text-sm text-gray-700">Page {currentPage} of {totalPages} ({totalResults} results)</span>
          <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition">Next</button>
        </div>
      )}
    </div>
  );
}

export default ManageToursTable;