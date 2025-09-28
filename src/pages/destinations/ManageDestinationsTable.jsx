import React from "react";
import { BiPlus, BiEdit, BiTrash, BiSearch } from 'react-icons/bi';

// Helper function to get the name from translations
const getTranslatedName = (destination, langCode) => {
  const translation = destination.translations?.find(t => t.language === langCode);
  return translation ? translation.name : destination.translations?.[0]?.name || 'N/A';
};

function ManageDestinationsTable({
  destinations,
  searchTerm,
  setSearchTerm,
  onPageChange,
  currentPage,
  totalPages,
  totalResults,
  onAddDestination,
  onEditDestination,
  onDeleteDestination,
  currentLanguageCode,
}) {
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    onPageChange(1);
  };

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-2 sm:mb-0">Manage Destinations</h3>
        <button
          onClick={onAddDestination}
          className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 text-sm sm:text-base transition"
        >
          <BiPlus className="mr-1" />
          Add Destination
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search by Name</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search"
              id="search"
              className="focus:ring-havanaBlue focus:border-havanaBlue block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search destinations..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">Image</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Location</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {destinations.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No destinations found.</td>
              </tr>
            ) : (
              destinations.map(destination => (
                <tr key={destination._id}>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {destination.image ? (
                      <img src={`${BACKEND_URL}${destination.image}`} alt={getTranslatedName(destination, currentLanguageCode)} className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded" />
                    ) : (
                      <span className="text-xs sm:text-sm">No Image</span>
                    )}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {getTranslatedName(destination, currentLanguageCode)}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{destination.location?.name || 'N/A'}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onEditDestination(destination)} className="text-havanaBlue hover:text-blue-700 mr-2 sm:mr-4 text-base sm:text-lg transition"><BiEdit /></button>
                    <button onClick={() => onDeleteDestination(destination)} className="text-red-500 hover:text-red-700 text-base sm:text-lg transition"><BiTrash /></button>
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

export default ManageDestinationsTable;
