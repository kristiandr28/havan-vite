import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BiReceipt } from 'react-icons/bi'; // Hanya menyisakan BiReceipt
// Header dihapus
// DetailModal, ImageModal, BookingModal dihapus

// Komponen Tickets sekarang menerima props dari App.js
function Tickets({ openDetailModal, activeCurrency, BACKEND_URL: appBackendUrl }) {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  // selectedTicket, selectedImage, isBookingModalOpen dihapus - App.js mengelola state DetailModal

  // Gunakan BACKEND_URL dari props jika tersedia, jika tidak, gunakan konstanta lokal
  const effectiveBackendUrl = import.meta.env.VITE_API_URL; // Fallback untuk keamanan


  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await axios.get(`${effectiveBackendUrl}/api/tickets`);
        console.log(
          'Tiket yang diambil:',
          response.data.map((t) => ({ _id: t._id, destination: t.destination.name }))
        );
        setTickets(response.data);
      } catch (err) {
        setError('Gagal mengambil tiket');
        console.error('Kesalahan pengambilan tiket:', err);
      }
    };

    fetchTickets();
  }, [effectiveBackendUrl]); // Bergantung pada effectiveBackendUrl

  // Menghapus semua modalHandlers lokal karena App.js sekarang mengelola DetailModal dan modal utama lainnya

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header dihapus karena dirender di App.js */}
      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <h2 className="text-3xl font-bold text-havanaGray mb-6 flex items-center">
          <BiReceipt className="mr-2 text-havanaPink" />
          Tiket Tersedia
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {tickets.map((ticket) => (
            <div
              key={ticket._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            >
              {ticket.image ? (
                <img
                  src={`${effectiveBackendUrl}${ticket.image}`}
                  alt={ticket.destination.name}
                  className="w-full h-48 sm:h-40 object-cover"
                  onError={(e) => {
                    console.error(
                      `Kesalahan pemuatan gambar untuk ${ticket.destination.name}:`,
                      `${effectiveBackendUrl}${ticket.image}`
                    );
                    e.target.src = 'https://placehold.co/300x200/CCCCCC/333333?text=No+Image'; // Placeholder yang diperbarui
                  }}
                />
              ) : (
                <div className="w-full h-48 sm:h-40 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500 text-sm">Tidak Ada Gambar</span>
                </div>
              )}
              <div className="p-6 sm:p-4">
                <h3 className="text-lg font-semibold text-havanaGray flex items-center">
                  <BiReceipt className="mr-2 text-havanaPink" />
                  {ticket.destination.name}
                </h3>
                <p className="text-gray-600 mt-2">
                  {ticket.description && ticket.description.length > 50
                    ? `${ticket.description.substring(0, 50)}...`
                    : ticket.description || 'Tidak ada deskripsi tersedia'}
                </p>
                <div className="flex justify-between items-center mt-2">
                  <p className="text-havanaBlue font-medium">
                    {activeCurrency.code} {ticket.price.toLocaleString()} / orang
                  </p>
                  <p className="text-gray-600 text-sm">{ticket.ticketType.join(', ') || 'N/A'}</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => openDetailModal(ticket, 'ticket')} // Perbaikan: Menghapus komentar JSX di sini
                    className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                  >
                    Lihat Detail
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Menghapus DetailModal, ImageModal, BookingModal lokal karena dikelola dan dirender oleh App.js */}
      </div>
    </div>
  );
}

export default Tickets;
