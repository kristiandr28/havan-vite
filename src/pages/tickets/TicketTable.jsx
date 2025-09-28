import React from 'react';
import { BiEdit, BiTrash } from 'react-icons/bi';

function TicketTable({ 
  tickets, 
  openFormModal, 
  openConfirmModal, 
  currentPage, 
  setCurrentPage, 
  totalPages, 
  totalResults,
  selectedLanguage,
}) {
  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Departure Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pax</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tickets.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                  No tickets found.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ticket.destination?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.ticketType?.join(', ') || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    IDR {ticket.price?.toLocaleString()} / person
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.departureLocation?.name || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {ticket.pax} pax
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                    {ticket.description || 'No description available'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openFormModal(ticket)}
                      className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                      aria-label={`Edit ticket for ${ticket.destination?.name || 'Unknown'}`}
                    >
                      <BiEdit className="text-lg" />
                    </button>
                    <button
                      onClick={() => openConfirmModal(ticket)}
                      className="text-red-500 hover:text-red-700 transition"
                      aria-label={`Delete ticket for ${ticket.destination?.name || 'Unknown'}`}
                    >
                      <BiTrash className="text-lg" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages} ({totalResults} results)
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

export default TicketTable;
