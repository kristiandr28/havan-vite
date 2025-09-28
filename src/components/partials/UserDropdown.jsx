import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiCog, BiUser, BiLogOut, BiGridAlt } from 'react-icons/bi'; // Import BiGridAlt for dashboard
// Removed axios import as it's no longer needed for profile picture fetch
import { dropdownVariants } from './modalVariants';

// --- UserDropdown Component (Revised) ---
function UserDropdown({ user, authToken, handleNavigation, handleLogout, openProfileModal, openDashboardModal }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // No more separate profilePicture state or fetch!
  // The profile picture URL comes directly from the 'user' prop.

  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const getInitial = () => {
    const source = user?.email || user?.username || 'A';
    return source.charAt(0).toUpperCase();
  };

  // Construct the full profile picture URL here
  const fullProfilePictureUrl = user?.profilePicture
    ? (user.profilePicture.startsWith('http') || user.profilePicture.startsWith('data:')) // Check if it's already a full URL or data URI
      ? user.profilePicture
      : `${BACKEND_URL}${user.profilePicture}` // Otherwise, assume it's a relative path from your backend
    : ''; // Empty string if no profilePicture

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <div
        onClick={toggleDropdown}
        className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-havanaBlue text-white
                   transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-havanaBlue focus:ring-opacity-50"
        role="button"
        tabIndex={0}
        aria-label={`User menu for ${user?.username || user?.email || 'User'}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            toggleDropdown();
          }
        }}
      >
        {/* Use fullProfilePictureUrl directly */}
        {fullProfilePictureUrl ? (
          <img
            src={fullProfilePictureUrl}
            alt="Profile"
            className="h-full w-full object-cover"
            onError={(e) => {
              console.log('UserDropdown: Avatar image failed to load, falling back to initial:', fullProfilePictureUrl);
              e.currentTarget.style.display = 'none'; // Hide the broken image
              e.currentTarget.nextSibling.style.display = 'flex'; // Show the initial
            }}
          />
        ) : (
          <span className="text-sm font-bold">{getInitial()}</span>
        )}
      </div>

      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            className="absolute right-0 top-full z-20 mt-2 w-48 rounded-lg bg-white/95 py-1 shadow-lg backdrop-blur-sm"
            variants={dropdownVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            key="dropdown"
          >
            <button
              onClick={() => {
                openDashboardModal(); // This should come from Header prop
                setIsDropdownOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-[12px] text-gray-700 transition-colors duration-150 hover:bg-havanaLightBlue/20 hover:text-havanaBlue sm:text-sm text-left"
            >
              <BiGridAlt className="mr-2" />
              Dashboard
            </button>
            <button
              onClick={() => {
                handleNavigation('/settings');
                setIsDropdownOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-[12px] text-gray-700 transition-colors duration-150 hover:bg-havanaLightBlue/20 hover:text-havanaBlue sm:text-sm text-left"
            >
              <BiCog className="mr-2" />
              Settings
            </button>
            <button
              onClick={() => {
                openProfileModal();
                setIsDropdownOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-[12px] text-gray-700 transition-colors duration-150 hover:bg-havanaLightBlue/20 hover:text-havanaBlue sm:text-sm text-left"
            >
              <BiUser className="mr-2" />
              Profile
            </button>
            <button
              onClick={() => {
                handleLogout();
                setIsDropdownOpen(false);
              }}
              className="flex w-full items-center px-4 py-2 text-[12px] text-red-500 transition-colors duration-150 hover:bg-red-50 hover:text-red-600 sm:text-sm text-left"
            >
              <BiLogOut className="mr-2" />
              Logout
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserDropdown;