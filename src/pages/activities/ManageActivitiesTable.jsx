import React from "react";
import { BiPlus, BiEdit, BiTrash, BiSearch } from 'react-icons/bi';
import Select from 'react-select';

function ManageActivitiesTable({
  activities,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  minPax,
  setMinPax,
  maxPax,
  setMaxPax,
  categoryOptions,
  onPageChange,
  currentPage,
  totalPages,
  totalResults,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
}) {
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    onPageChange(1);
  };

  const handleFilterChange = (setter, pageReset = true) => (e) => {
    setter(e.target.value);
    if (pageReset) onPageChange(1);
  };

  const handleSelectChange = (selected) => {
    setSelectedCategory(selected ? selected.value : '');
    onPageChange(1);
  };

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
        <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-2 sm:mb-0">Manage Activities</h3>
        <button
          onClick={onAddActivity}
          className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 text-sm sm:text-base transition"
        >
          <BiPlus className="mr-1" />
          Add Activity
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
              placeholder="Search activities..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div className="col-span-1">
          <label htmlFor="filterCategory" className="block text-sm font-medium text-gray-700">Filter by Category</label>
          <Select
            id="filterCategory"
            options={categoryOptions}
            onChange={handleSelectChange}
            value={categoryOptions.find(opt => opt.value === selectedCategory) || null}
            isClearable
            placeholder="Select category..."
            className="mt-1 text-sm sm:text-base"
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700">Min Price</label>
          <input
            type="number"
            name="minPrice"
            id="minPrice"
            value={minPrice}
            onChange={handleFilterChange(setMinPrice)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
            placeholder="e.g., 50000"
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700">Max Price</label>
          <input
            type="number"
            name="maxPrice"
            id="maxPrice"
            value={maxPrice}
            onChange={handleFilterChange(setMaxPrice)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
            placeholder="e.g., 200000"
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="minPax" className="block text-sm font-medium text-gray-700">Min Pax</label>
          <input
            type="number"
            name="minPax"
            id="minPax"
            value={minPax}
            onChange={handleFilterChange(setMinPax)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
          />
        </div>

        <div className="col-span-1">
          <label htmlFor="maxPax" className="block text-sm font-medium text-gray-700">Max Pax</label>
          <input
            type="number"
            name="maxPax"
            id="maxPax"
            value={maxPax}
            onChange={handleFilterChange(setMaxPax)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
          />
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">Image</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Name</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">Category</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Price</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px]">Pax</th>
              <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">No activities found.</td>
              </tr>
            ) : (
              activities.map(activity => (
                <tr key={activity._id}>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                    {activity.image ? (
                      <img src={`${BACKEND_URL}${activity.image}`} alt={activity.name} className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded" />
                    ) : (
                      <span className="text-xs sm:text-sm">No Image</span>
                    )}
                  </td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.name}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{activity.category?.name || 'N/A'}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">Rp {activity.price.toLocaleString()}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">{activity.pax}</td>
                  <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                    <button onClick={() => onEditActivity(activity)} className="text-havanaBlue hover:text-blue-700 mr-2 sm:mr-4 text-base sm:text-lg transition"><BiEdit /></button>
                    <button onClick={() => onDeleteActivity(activity)} className="text-red-500 hover:text-red-700 text-base sm:text-lg transition"><BiTrash /></button>
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

export default ManageActivitiesTable;