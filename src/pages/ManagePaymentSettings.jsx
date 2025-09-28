import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiLoaderAlt } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';

function ManagePaymentSettings() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [setting, setSetting] = useState(null);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  // --- Fetch current payment setting ---
  const fetchPaymentSetting = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/payment-settings`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setSetting(response.data);
    } catch (err) {
      setError('Failed to fetch payment settings');
      console.error('Fetch payment setting error:', err.response?.data?.message || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, handleLogout]);

  // --- Autentikasi & fetch ---
  useEffect(() => {
    if (!isAuthReady) return;
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }
    fetchPaymentSetting();
  }, [isAuthenticated, user, isAuthReady, navigate, fetchPaymentSetting]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // --- Update setting ---
  const handleActivate = useCallback(
    async (provider) => {
      try {
        const response = await axios.put(
          `${BACKEND_URL}/api/payment-settings`,
          { provider },
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setSetting(response.data);
        setError('');
      } catch (err) {
        setError(err.response?.data.message || 'Failed to update payment provider');
        console.error('Update provider error:', err.response?.data || err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          handleLogout();
        }
      }
    },
    [BACKEND_URL, authToken, handleLogout]
  );

  // --- Loading ---
  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Memuat autentikasi...</p>
      </div>
    );
  }

  // --- List provider fixed ---
  const providers = [
    { name: 'Xendit', key: 'xendit', description: 'Payment gateway menggunakan Xendit' },
    { name: 'SwiftCode', key: 'swiftcode', description: 'Pembayaran via transfer bank menggunakan Swift Code' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 md:ml-64">
        <AdminHeader toggleSidebar={toggleSidebar} />
        <div className="pt-20 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-havanaGray">Payment Settings</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {providers.map((p) => (
                    <tr key={p.key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{p.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleActivate(p.key)}
                          className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-200 ease-in-out ${
                            setting?.provider === p.key ? 'bg-havanaBlue' : 'bg-gray-300'
                          }`}
                          aria-label={`Activate ${p.name}`}
                        >
                          <span
                            className={`absolute left-0 inline-block w-5 h-5 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
                              setting?.provider === p.key ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {setting?.provider && (
                <p className="mt-4 text-sm text-gray-600">
                  Currently active: <span className="font-semibold text-havanaBlue">{setting.provider}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManagePaymentSettings;
