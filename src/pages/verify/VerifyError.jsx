// src/pages/verify/VerifyError.jsx
import React from "react";
import { Link } from "react-router-dom";

const VerifyError = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-pink-50">
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold text-red-500">⚠️ Terjadi Kesalahan</h1>
        <p className="mt-3 text-gray-600">
          Maaf, ada masalah pada server. Coba lagi nanti.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
};

export default VerifyError;
