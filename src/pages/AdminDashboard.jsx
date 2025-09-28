import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import { BiLoaderAlt } from 'react-icons/bi';
import { FaUsers, FaTicketAlt, FaMoneyBillWave, FaChartBar } from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const BACKEND_URL = import.meta.env.VITE_API_URL;
const PIE_COLORS = ['#3B82F6', '#22C55E', '#EF4444', '#F59E0B', '#6B7280'];

function AdminDashboard() {
  // Use authToken from useAuth hook
  const { user, authToken, isAuthenticated, isAuthReady } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const [summaryData, setSummaryData] = useState(null);
  const [bookingStatusData, setBookingStatusData] = useState(null);
  const [topItemsData, setTopItemsData] = useState(null);
  const [monthlyBookingsData, setMonthlyBookingsData] = useState(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthReady) {
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }

    if (user?.role !== 'admin') {
      navigate('/', { replace: true });
      return;
    }

    // Make sure authToken exists before trying to fetch data
    if (!authToken) {
      setError('Authentication failed. Please log in again.');
      setLoadingAnalytics(false);
      return;
    }

    const fetchAnalyticsData = async () => {
      try {
        setLoadingAnalytics(true);
        // Use authToken from useAuth hook
        const headers = { 'Authorization': `Bearer ${authToken}` };

        const [summaryRes, statusRes, topItemsRes, monthlyRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/analytics/summary`, { headers }),
          fetch(`${BACKEND_URL}/api/analytics/booking-status`, { headers }),
          fetch(`${BACKEND_URL}/api/analytics/top-items`, { headers }),
          fetch(`${BACKEND_URL}/api/analytics/monthly-bookings`, { headers })
        ]);

        if (!summaryRes.ok || !statusRes.ok || !topItemsRes.ok || !monthlyRes.ok) {
          throw new Error('Failed to fetch analytics data.');
        }

        const summaryData = await summaryRes.json();
        const statusData = await statusRes.json();
        const topItemsData = await topItemsRes.json();
        const monthlyBookingsData = await monthlyRes.json();

        setSummaryData(summaryData);
        setBookingStatusData(Object.entries(statusData).map(([name, value]) => ({ name, value })));
        setTopItemsData(topItemsData);
        setMonthlyBookingsData(monthlyBookingsData);

      } catch (err) {
        console.error("Error fetching analytics data:", err);
        setError("Failed to load analytics data. Please try again.");
      } finally {
        setLoadingAnalytics(false);
      }
    };

    fetchAnalyticsData();

  }, [isAuthReady, isAuthenticated, user, authToken, navigate]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Verifying admin status...</p>
        <p className="text-sm text-gray-500 mt-2">Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 md:ml-64">
        <AdminHeader toggleSidebar={toggleSidebar} />
        <div className="pt-20 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h3 className="text-2xl font-semibold text-havanaGray mb-4">
            Welcome to the Havana Admin Dashboard 👋
          </h3>
          <p className="text-gray-600 mb-8">
            Manage your tours and explore the admin features to enhance your travel platform.
          </p>

          {loadingAnalytics ? (
            <div className="flex items-center justify-center h-64">
              <BiLoaderAlt className="animate-spin text-4xl text-havanaBlue" />
            </div>
          ) : error ? (
            <div className="text-red-500 font-medium text-center">{error}</div>
          ) : (
            <>
              {/* === Summary Analytics Card === */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-3xl font-bold text-havanaGray mt-1">{summaryData?.totalUsers}</p>
                  </div>
                  <FaUsers className="text-havanaBlue text-4xl opacity-30" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                    <p className="text-3xl font-bold text-havanaGray mt-1">{summaryData?.totalBookings}</p>
                  </div>
                  <FaTicketAlt className="text-havanaBlue text-4xl opacity-30" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Confirmed Bookings</p>
                    <p className="text-3xl font-bold text-havanaGray mt-1">{summaryData?.confirmedBookings}</p>
                  </div>
                  <FaChartBar className="text-havanaBlue text-4xl opacity-30" />
                </div>
                <div className="bg-white rounded-lg shadow-sm p-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-3xl font-bold text-havanaGray mt-1">Rp {summaryData?.totalRevenue?.toLocaleString('id-ID')}</p>
                  </div>
                  <FaMoneyBillWave className="text-havanaBlue text-4xl opacity-30" />
                </div>
              </div>

              {/* === Charts and Top Items Card === */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Booking Trends Chart */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-xl font-semibold text-havanaGray mb-4">Monthly Booking Trends</h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={monthlyBookingsData}>
                      <XAxis dataKey="month" stroke="#888888" />
                      <YAxis stroke="#888888" />
                      <Tooltip formatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#3B82F6" name="Revenue (IDR)" />
                      <Bar dataKey="bookings" fill="#22C55E" name="Number of Bookings" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                {/* Booking Status Distribution Chart (Pie Chart) */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h4 className="text-xl font-semibold text-havanaGray mb-4">Booking Status Distribution</h4>
                  <div className="flex justify-center items-center h-full">
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={bookingStatusData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          label
                        >
                          {bookingStatusData?.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Items List */}
                <div className="bg-white rounded-lg shadow-sm p-6 col-span-1 lg:col-span-2">
                  <h4 className="text-xl font-semibold text-havanaGray mb-4">Top Items (Most Booked)</h4>
                  <ul className="list-disc list-inside space-y-2">
                    {topItemsData?.length > 0 ? (
                      topItemsData.map((item, index) => (
                        <li key={index}>
                          <span className="font-semibold">{item.name}</span> ({item.itemType}): {item.totalQuantity} bookings
                        </li>
                      ))
                    ) : (
                      <p className="text-gray-500">No booking data available yet.</p>
                    )}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
