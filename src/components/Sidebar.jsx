import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BiGridAlt, BiMap, BiLogOut, BiX, BiWalk, BiCog, BiChevronDown, BiGlobe, BiCategory, BiDollar, BiPin, BiCheckCircle, BiXCircle, BiReceipt, BiUser, BiImage, BiUserVoice, BiListCheck, BiInfoCircle, BiBarChartAlt2, BiCreditCard, BiMoney } from 'react-icons/bi';

function Sidebar({ isOpen, toggleSidebar }) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);

  // Using useAuth for logout is recommended here for consistency with frontend
  // If not using useAuth, ensure this logout clears backend session if applicable
  const handleLogout = () => {
    localStorage.removeItem('authToken'); // Use authToken as per useAuth.js
    localStorage.removeItem('user');     // Use user as per useAuth.js
    // If you have a Firebase session, ensure signOut(auth) is called here too
    // or ensure your backend handles token invalidation
    navigate('/login'); // Redirect to public login page
  };

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
    setPaymentOpen(false); // Close payment dropdown when opening settings
  };

  const togglePayment = () => {
    setPaymentOpen(!paymentOpen);
    setSettingsOpen(false); // Close settings dropdown when opening payment
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 transition-transform duration-300 ease-in-out z-20`}
    >
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <BiMap className="text-havanaPink text-2xl" />
          <h2 className="text-xl font-bold text-havanaPink">Havana Admin</h2>
        </div>
        <button className="md:hidden" onClick={toggleSidebar} aria-label="Close sidebar">
          <BiX className="text-2xl text-havanaGray" />
        </button>
      </div>
      <nav className="mt-4 overflow-y-auto h-[calc(100%-60px)] pb-4">
        <ul className="space-y-2">
          <li>
            <Link
              to="/admin/dashboard"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar} // Close sidebar on navigation for mobile
            >
              <BiGridAlt className="mr-2" />
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              to="/admin/tours"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiMap className="mr-2" />
              Tours
            </Link>
          </li>
          <li>
            <Link
              to="/admin/tickets"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiReceipt className="mr-2" />
              Tickets
            </Link>
          </li>
          <li>
            <Link
              to="/admin/activities"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiWalk className="mr-2" />
              Activities
            </Link>
          </li>
          <li>
            <Link
              to="/admin/orders"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiListCheck className="mr-2" />
              Orders
            </Link>
          </li>
          <li>
            <Link
              to="/admin/reports"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiBarChartAlt2 className="mr-2" />
              Reports
            </Link>
          </li>
          <li>
            <Link
              to="/admin/destinations"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiPin className="mr-2" />
              Destinations
            </Link>
          </li>
          <li>
            <Link
              to="/admin/speaking-guides"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiUserVoice className="mr-2" />
              Speaking Guides
            </Link>
          </li>
          <li>
            <Link
              to="/admin/gallery"
              className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
              onClick={toggleSidebar}
            >
              <BiImage className="mr-2" />
              Gallery
            </Link>
          </li>
          {/* Payment Settings Dropdown Menu */}
          <li>
            <button
              onClick={togglePayment}
              className="flex items-center w-full px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
            >
              <BiCreditCard className="mr-2" />
              Payment Settings
              <BiChevronDown className={`ml-auto transform ${paymentOpen ? 'rotate-180' : ''}`} />
            </button>
            {paymentOpen && (
              <ul className="pl-6 space-y-1">
                <li>
                  <Link
                    to="/admin/bankswift"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiMoney className="mr-2" />
                    Bank Swift
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/payment-settings"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiCreditCard className="mr-2" />
                    Payment Gateway
                  </Link>
                </li>
              </ul>
            )}
          </li>
          {/* General Settings Dropdown Menu */}
          <li>
            <button
              onClick={toggleSettings}
              className="flex items-center w-full px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
            >
              <BiCog className="mr-2" />
              General Settings
              <BiChevronDown className={`ml-auto transform ${settingsOpen ? 'rotate-180' : ''}`} />
            </button>
            {settingsOpen && (
              <ul className="pl-6 space-y-1">
                <li>
                  <Link
                    to="/admin/languages"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiGlobe className="mr-2" />
                    Languages
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/categories"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiCategory className="mr-2" />
                    Categories
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/currencies"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiDollar className="mr-2" />
                    Currencies
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/included"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiCheckCircle className="mr-2" />
                    Included
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/excluded"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiXCircle className="mr-2" />
                    Excluded
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/contacts"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiUser className="mr-2" />
                    Contacts
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/heroes"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiImage className="mr-2" />
                    Heroes
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/about"
                    className="flex items-center px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
                    onClick={toggleSidebar}
                  >
                    <BiInfoCircle className="mr-2" />
                    About Us
                  </Link>
                </li>
              </ul>
            )}
          </li>
          <li>
            <button
              onClick={() => {
                handleLogout();
                toggleSidebar(); // Close sidebar on logout for mobile
              }}
              className="flex items-center w-full px-4 py-2 text-havanaGray hover:bg-havanaBlue hover:text-white"
            >
              <BiLogOut className="mr-2" />
              Logout
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;