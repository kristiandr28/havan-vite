import React from "react";
import { BiPlus, BiEdit, BiTrash, BiSearch } from 'react-icons/bi';

function ManageLocationsTable({
  locations,
  searchTerm,
  setSearchTerm,
  onAddLocation,
  onEditLocation,
  onDeleteLocation,
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-2 sm:mb-0">Manage Locations</h3>
        <button
          onClick={onAddLocation}
          className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 text-sm sm:text-base transition"
        >
          <BiPlus className="mr-1" />
          Add Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-6">
        <div className="col-span-1">
          <label htmlFor="search-location" className="block text-sm font-medium text-gray-700">Search by Name</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <BiSearch className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              name="search-location"
              id="search-location"
              className="focus:ring-havanaBlue focus:border-havanaBlue block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search locations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {locations.length === 0 ? (
              <tr>
                <td colSpan="2" className="px-6 py-4 text-center text-sm text-gray-500">No locations found.</td>
              </tr>
            ) : (
              locations.map(location => (
                <tr key={location._id}>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{location.name}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onEditLocation(location)} className="text-havanaBlue hover:text-blue-700 mr-2 sm:mr-4 text-base sm:text-lg transition"><BiEdit /></button>
                    <button onClick={() => onDeleteLocation(location)} className="text-red-500 hover:text-red-700 text-base sm:text-lg transition"><BiTrash /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManageLocationsTable;