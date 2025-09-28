// src/pages/verify/VerifySuccess.jsx
import React from "react";
import { Link } from "react-router-dom";

const VerifySuccess = () => {
  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="bg-white rounded-lg p-10 text-center max-w-sm w-full transform transition-all duration-300 hover:shadow-lg">
        <h1 className="text-3xl font-extrabold text-green-500 mb-2">
          Success!
        </h1>
        <p className="text-lg text-gray-700">
          Your email has been verified.
        </p>
        <p className="mt-4 text-gray-500">
          You can now log in to your account.
        </p>
        <Link
          to="/"
          className="mt-8 inline-block bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-full transition-colors duration-300 ease-in-out transform hover:scale-105"
        >
          Login Now
        </Link>
      </div>
    </div>
  );
};

export default VerifySuccess;