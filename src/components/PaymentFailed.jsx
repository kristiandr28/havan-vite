// src/pages/PaymentFailed.js (atau src/components/PaymentFailed.js)

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const PaymentFailed = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorMessage = params.get('message') || 'Pembayaran Anda tidak dapat diproses.'; // Ambil pesan error dari URL

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl text-center max-w-lg w-full">
        <svg
          className="mx-auto h-24 w-24 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          ></path>
        </svg>
        <h1 className="text-4xl font-bold text-red-700 mt-6 mb-4">Pembayaran Gagal</h1>
        <p className="text-lg text-gray-700 mb-6">
          Maaf, pembayaran Anda tidak berhasil. Silakan coba lagi atau gunakan metode pembayaran lain.
        </p>
        <p className="text-md text-red-600 mb-8">
          Pesan Kesalahan: **{errorMessage}**
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/checkout" // Ganti dengan rute ke halaman checkout Anda
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition duration-300 text-center"
          >
            Coba Pembayaran Lagi
          </Link>
          <Link
            to="/contact-us" // Ganti dengan rute ke halaman kontak support Anda
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition duration-300 text-center"
          >
            Hubungi Dukungan
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;