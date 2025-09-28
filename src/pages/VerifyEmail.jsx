// src/pages/VerifyEmail.jsx
import React, { useEffect, useState } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios";

const VerifyEmail = () => {
  const [status, setStatus] = useState("loading"); // loading | success | error
  const [message, setMessage] = useState("");

  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const token = queryParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Verification token not found.");
      return;
    }

    const verifyEmail = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL }/api/auth/verify-email?token=${token}`
        );
        setStatus("success");
        setMessage(res.data.message);
      } catch (err) {
        setStatus("error");
        setMessage(
          err.response?.data?.message || "Verification failed. Please try again."
        );
      }
    };

    verifyEmail();
  }, [location.search]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 max-w-md text-center">
        {status === "loading" && (
          <p className="text-gray-600 text-lg">Verifying your email...</p>
        )}

        {status === "success" && (
          <>
            <h2 className="text-2xl font-bold text-green-600 mb-4">
              Email Verified ✅
            </h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <Link
              to="/login"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h2 className="text-2xl font-bold text-red-600 mb-4">
              Verification Failed ❌
            </h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <Link
              to="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Register Again
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
