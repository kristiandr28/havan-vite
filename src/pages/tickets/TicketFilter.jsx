import { useCallback } from 'react';
import Select from 'react-select';
import React from "react";

function TicketFilter({ 
  searchTerm, setSearchTerm, 
  selectedDestinationFilter, setSelectedDestinationFilter, 
  selectedDepartureLocationFilter, setSelectedDepartureLocationFilter,
  selectedTicketTypeFilter, setSelectedTicketTypeFilter,
  minPriceFilter, setMinPriceFilter,
  maxPriceFilter, setMaxPriceFilter,
  maxPaxFilter, setMaxPaxFilter,
  destinations, locations, setCurrentPage
}) {

  const handleFilterInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentPage(1);
    switch (name) {
      case 'searchTerm': setSearchTerm(value); break;
      case 'minPriceFilter': setMinPriceFilter(value); break;
      case 'maxPriceFilter': setMaxPriceFilter(value); break;
      case 'maxPaxFilter': setMaxPaxFilter(value); break;
      default: break;
    }
  }, [setCurrentPage, setSearchTerm, setMinPriceFilter, setMaxPriceFilter, setMaxPaxFilter]);

  const handleSelectChange = useCallback((selectedOptions, field) => {
    setCurrentPage(1);
    switch (field) {
      case 'destinationFilter': setSelectedDestinationFilter(selectedOptions); break;
      case 'departureLocationFilter': setSelectedDepartureLocationFilter(selectedOptions); break;
      case 'ticketType': setSelectedTicketTypeFilter(selectedOptions); break;
      default: break;
    }
  }, [setCurrentPage, setSelectedDestinationFilter, setSelectedDepartureLocationFilter, setSelectedTicketTypeFilter]);

  const destinationOptions = destinations.map(dest => ({
    value: dest._id,
    label: `${dest.name} (${dest.location})`
  }));

  const locationOptions = locations.map(loc => ({
    value: loc._id,
    label: loc.name
  }));

  const ticketTypeOptions = [
    { value: 'One-Way', label: 'One-Way' },
    { value: 'Round-Trip', label: 'Round-Trip' }
  ];

  return (
    <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div>
        <label htmlFor="searchTickets" className="block text-sm font-medium text-gray-700">Search Description</label>
        <div className="mt-1 flex rounded-md shadow-sm">
          <input
            type="text"
            id="searchTickets"
            name="searchTerm"
            className="focus:ring-havanaBlue focus:border-havanaBlue block w-full rounded-md sm:text-sm border-gray-300"
            placeholder="Search description..."
            value={searchTerm}
            onChange={handleFilterInputChange}
          />
        </div>
      </div>

      <div>
        <label htmlFor="filterDestination" className="block text-sm font-medium text-gray-700">Destination</label>
        <Select
          id="filterDestination"
          options={destinationOptions}
          value={selectedDestinationFilter}
          onChange={(selected) => handleSelectChange(selected, 'destinationFilter')}
          className="mt-1"
          placeholder="Filter by destination..."
          isClearable
        />
      </div>

      <div>
        <label htmlFor="filterDepartureLocation" className="block text-sm font-medium text-gray-700">Departure Location</label>
        <Select
          id="filterDepartureLocation"
          options={locationOptions}
          value={selectedDepartureLocationFilter}
          onChange={(selected) => handleSelectChange(selected, 'departureLocationFilter')}
          className="mt-1"
          placeholder="Filter by location..."
          isClearable
        />
      </div>

      <div>
        <label htmlFor="filterTicketType" className="block text-sm font-medium text-gray-700">Ticket Type</label>
        <Select
          id="filterTicketType"
          isMulti
          options={ticketTypeOptions}
          value={selectedTicketTypeFilter}
          onChange={(selected) => handleSelectChange(selected, 'ticketType')}
          className="mt-1"
          placeholder="Filter by type(s)..."
        />
      </div>

      <div>
        <label htmlFor="minPriceFilter" className="block text-sm font-medium text-gray-700">Min Price</label>
        <input
          type="number"
          id="minPriceFilter"
          name="minPriceFilter"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
          value={minPriceFilter}
          onChange={handleFilterInputChange}
          placeholder="Min Price"
        />
      </div>

      <div>
        <label htmlFor="maxPriceFilter" className="block text-sm font-medium text-gray-700">Max Price</label>
        <input
          type="number"
          id="maxPriceFilter"
          name="maxPriceFilter"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
          value={maxPriceFilter}
          onChange={handleFilterInputChange}
          placeholder="Max Price"
        />
      </div>
      <div>
        <label htmlFor="maxPaxFilter" className="block text-sm font-medium text-gray-700">Pax</label>
        <input
          type="number"
          id="maxPaxFilter"
          name="maxPaxFilter"
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
          value={maxPaxFilter}
          onChange={handleFilterInputChange}
          placeholder="Exact Pax"
        />
      </div>
    </div>
  );
}

export default TicketFilter;