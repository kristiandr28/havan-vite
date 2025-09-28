import React, { useState } from "react";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
        const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Error");
        setMessage(data.message);
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
    };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Forgot Password</h2>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
