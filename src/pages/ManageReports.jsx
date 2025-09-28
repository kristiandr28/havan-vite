import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiLoaderAlt, BiDownload, BiMoney, BiCalendarCheck, BiCreditCard, BiBarChartAlt2 } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { format } from 'date-fns';

function ManageReports() {
  const { user, authToken, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalBookings: 0, totalPaid: 0, totalRevenue: 0 });
  const [profit, setProfit] = useState({ totalRevenue: 0, totalCost: 0, totalProfit: 0 });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    status: '',
    paymentStatus: '',
  });

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/reports/summary`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setSummary(response.data);
    } catch (err) {
      let errorMessage = 'Failed to load report summary';
      if (err.response) {
        errorMessage = err.response.data.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
      console.error('Fetch summary error:', err);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, authToken]);

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters).toString();
      const response = await axios.get(`${BACKEND_URL}/api/reports/transactions?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setTransactions(response.data);
    } catch (err) {
      let errorMessage = 'Failed to load transaction list';
      if (err.response) {
        errorMessage = err.response.data.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
      console.error('Fetch transactions error:', err);
    } finally {
      setLoading(false);
    }
  }, [BACKEND_URL, authToken, filters]);

  const fetchProfit = useCallback(async () => {
    try {
      const { startDate, endDate } = filters;
      const params = new URLSearchParams({ startDate, endDate }).toString();
      const response = await axios.get(`${BACKEND_URL}/api/reports/profit?${params}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setProfit(response.data);
    } catch (err) {
      let errorMessage = 'Failed to load profit report';
      if (err.response) {
        errorMessage = err.response.data.message || `Error ${err.response.status}`;
      }
      setError(errorMessage);
      console.error('Fetch profit error:', err);
    }
  }, [BACKEND_URL, authToken, filters]);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchSummary();
    fetchTransactions();
    fetchProfit();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken, fetchSummary, fetchTransactions, fetchProfit]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  const handleFilterChange = useCallback((e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleDownloadPDF = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/reports/transactions/pdf`, {
        headers: { Authorization: `Bearer ${authToken}` },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'transaction-report.pdf');
      document.body.appendChild(link);
      link.click();
      link.remove();
      setError('');
    } catch (err) {
      setError(err.response?.data.message || 'Failed to download PDF report');
      console.error('PDF download error:', err);
    }
  }, [BACKEND_URL, authToken]);

  if (!isAuthReady || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Loading reports...</p>
      </div>
    );
  }

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
          
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6">
            <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-4">Reports & Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center text-havanaBlue">
                  <BiCalendarCheck className="h-6 w-6 mr-2" />
                  <span className="font-semibold text-lg">Total Bookings</span>
                </div>
                <p className="text-3xl font-bold mt-2 text-havanaGray">{summary.totalBookings}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center text-green-700">
                  <BiCreditCard className="h-6 w-6 mr-2" />
                  <span className="font-semibold text-lg">Successful Payments</span>
                </div>
                <p className="text-3xl font-bold mt-2 text-havanaGray">{summary.totalPaid}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center text-yellow-700">
                  <BiMoney className="h-6 w-6 mr-2" />
                  <span className="font-semibold text-lg">Total Revenue</span>
                </div>
                <p className="text-xl font-bold mt-2 text-havanaGray">IDR {(summary.totalRevenue || 0).toLocaleString('id-ID')}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                <div className="flex items-center text-purple-700">
                  <BiBarChartAlt2 className="h-6 w-6 mr-2" />
                  <span className="font-semibold text-lg">Total Profit</span>
                </div>
                <p className="text-xl font-bold mt-2 text-havanaGray">IDR {(profit.totalProfit || 0).toLocaleString('id-ID')}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-2 sm:mb-0">Transaction Report</h3>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center bg-green-500 text-white py-1.5 px-3 rounded-md hover:bg-green-600 text-sm sm:text-base transition"
              >
                <BiDownload className="mr-1" />
                Download PDF
              </button>
            </div>
            
            {/* Filter Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  id="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  id="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">Booking Status</label>
                <select
                  name="status"
                  id="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">Payment Status</label>
                <select
                  name="paymentStatus"
                  id="paymentStatus"
                  value={filters.paymentStatus}
                  onChange={handleFilterChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                >
                  <option value="">All Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Transaction ID
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[150px]">
                      Customer
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Date
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Total Price
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Booking Status
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Payment Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                        No transactions found.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                          {booking._id}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {booking.user?.username || '-'}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(new Date(booking.createdAt), 'dd MMM yyyy')}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.currency} {(booking.totalPrice || 0).toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.status}
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-500">
                          {booking.paymentStatus}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ManageReports;