import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';

// Ambil URL API dari environment variable
const API_URL = import.meta.env.VITE_API_URL;

const PaymentSuccess = () => {
  const location = useLocation();
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const idFromUrl = params.get('bookingId');
    setBookingId(idFromUrl);

    if (!idFromUrl) {
      setError("ID booking tidak ditemukan dalam URL. Silakan cek riwayat pesanan Anda.");
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          throw new Error("Token otentikasi tidak ditemukan. Silakan login kembali.");
        }

        const response = await fetch(`${API_URL}/api/bookings/${idFromUrl}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        // Cek status respons. Jika tidak ok, server mengirimkan error.
        if (!response.ok) {
          // Coba baca body sebagai teks untuk debugging
          const errorText = await response.text();
          console.error('Server error response:', errorText);

          // Coba parse body error sebagai JSON
          const errorData = JSON.parse(errorText || '{}');
          throw new Error(errorData.message || 'Gagal mengambil detail booking. Server merespons dengan kesalahan.');
        }

        // Jika respons sukses, cek apakah itu JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const errorText = await response.text();
          console.error('Expected JSON, but received:', errorText);
          throw new Error('Respons server bukan JSON yang valid.');
        }

        const data = await response.json();
        setBookingDetails(data);
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setError(err.message || "Gagal memuat detail booking Anda. Silakan cek riwayat pesanan Anda.");
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [location.search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <p className="text-lg text-gray-700">Memuat detail pesanan Anda...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4">
        <h2 className="text-3xl font-bold text-red-700 mb-4">Terjadi Kesalahan!</h2>
        <p className="text-lg text-red-600 mb-6">{error}</p>
        <Link to="/my-bookings" className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300">
          Lihat Riwayat Pesanan Saya
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-green-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg w-full">
        <svg
          className="mx-auto h-24 w-24 text-green-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className="text-4xl font-bold text-green-700 mt-6 mb-4">Pembayaran Berhasil!</h1>
        <p className="text-lg text-gray-700 mb-6">
          Terima kasih! Pesanan Anda dengan ID **`{bookingId}`** telah berhasil dikonfirmasi.
        </p>

        {bookingDetails ? (
          <div className="mb-6 text-left">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">Detail Pesanan Anda:</h3>
            <p className="text-gray-600"><strong>Nama Pelanggan:</strong> {bookingDetails.user?.username}</p>
            <p className="text-gray-600"><strong>Tanggal Pesanan:</strong> {new Date(bookingDetails.createdAt).toLocaleDateString()}</p>
            <p className="text-gray-600">
              <strong>Total Pembayaran:</strong> Rp {bookingDetails.totalPrice?.toLocaleString('id-ID')}
            </p>
            <h4 className="font-semibold text-gray-700 mt-4 mb-2">Item yang Dipesan:</h4>
            <ul className="list-disc list-inside text-gray-600">
                {bookingDetails.items?.map((item, index) => (
                    <li key={index}>
                        {item.itemId?.title || item.itemId?.name} - {item.quantity} orang ({item.price.toLocaleString('id-ID')})
                    </li>
                ))}
            </ul>
          </div>
        ) : (
          <p className="text-gray-600 mb-6">
            Detail pesanan Anda sedang dimuat atau tidak tersedia. Silakan cek riwayat pesanan Anda.
          </p>
        )}

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/my-bookings"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition duration-300 text-center"
          >
            Lihat Riwayat Pesanan Saya
          </Link>
          <Link
            to="/"
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-300 text-center"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;