import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // ---- CLIENT-SIDE VALIDATION ----
    if (!newPassword || !confirmPassword) {
      setError("Both password fields are required.");
      setLoading(false);
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long.");
      setLoading(false);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("Invalid or missing token.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "An error occurred.");
      
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Reset Password</h2>

        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          <input
            type="password"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}