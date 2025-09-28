// src/pages/verify/VerifyFailed.jsx
import React from "react";
import { Link } from "react-router-dom";

const VerifyFailed = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg p-10 text-center max-w-sm w-full transform transition-all duration-300 hover:shadow-lg">
        <h1 className="text-3xl font-extrabold text-red-500 mb-2">
          Verification Failed
        </h1>
        <p className="text-lg text-gray-700">
          The link is invalid or has expired.
        </p>
        <p className="mt-4 text-gray-500">
          Please try to register again.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-300 ease-in-out transform hover:scale-105"
        >
          Register Again
        </Link>
      </div>
    </div>
  );
};

export default VerifyFailed;