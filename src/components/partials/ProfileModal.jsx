import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiUser, BiX, BiCamera } from 'react-icons/bi';
import axios from 'axios';
import { modalVariants, contentVariants, childVariants } from './modalVariants';

function ProfileModal({ isOpen, closeModal, user, token, onProfileUpdate }) {
  const [profile, setProfile] = useState({
    fullName: '',
    phone: '',
    address: '',
    profilePicture: '',
  });
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    console.log('ProfileModal user prop:', user);
    if (isOpen && user?.role === 'customer') {
      fetchProfile();
      if (!email || !username) {
        fetchUserData();
      }
    }
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [isOpen]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched profile:', response.data);
      setProfile({
        ...response.data,
        profilePicture: response.data.profilePicture
          ? `${BACKEND_URL}${response.data.profilePicture}`
          : '',
      });
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile');
      console.error('Fetch profile error:', err);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Fetched user data:', response.data);
      setEmail(response.data.email || 'No email available');
      setUsername(response.data.username || 'No username available');
    } catch (err) {
      console.error('Fetch user data error:', err);
      setEmail('No email available');
      setUsername('No username available');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const newPreviewUrl = URL.createObjectURL(selectedFile);
      setPreviewUrl(newPreviewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/profile`,
        {
          fullName: profile.fullName,
          phone: profile.phone,
          address: profile.address,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProfile({
        ...response.data,
        profilePicture: response.data.profilePicture
          ? `${BACKEND_URL}${response.data.profilePicture}`
          : '',
      });

      if (file) {
        const formData = new FormData();
        formData.append('profilePicture', file);
        console.log('Uploading file:', file.name);
        const uploadResponse = await axios.post(
          `${BACKEND_URL}/api/profile/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );
        console.log('Upload response:', uploadResponse.data);
        setProfile((prev) => ({
          ...prev,
          profilePicture: `${BACKEND_URL}${uploadResponse.data.profilePicture}`,
        }));
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setFile(null);
      }

      setIsEditing(false);
      setError('');
      onProfileUpdate(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile');
      console.error('Update profile error:', err);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    setFile(null);
    fetchProfile();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
          key="profile-modal-overlay"
        >
          <motion.div
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-lg shadow-lg max-h-[80vh] overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            key="profile-modal-content"
          >
            <motion.div
              className="flex justify-between items-center mb-4"
              variants={childVariants}
            >
              <div className="flex items-center space-x-2">
                <BiUser className="text-havanaBlue text-xl" />
                <h3 className="text-base sm:text-lg font-semibold text-havanaGray">
                  My Profile
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close profile modal"
              >
                <BiX className="text-xl" />
              </button>
            </motion.div>
            {error && (
              <motion.p
                className="text-red-500 mb-4 text-[15px] sm:text-sm"
                variants={childVariants}
              >
                {error}
              </motion.p>
            )}
            {user?.role === 'customer' ? (
              <motion.form
                onSubmit={handleSubmit}
                className="space-y-4"
                variants={childVariants}
              >
                <motion.div
                  className="flex justify-center"
                  variants={childVariants}
                >
                  <div className="relative">
                    <img
                      src={
                        previewUrl ||
                        profile.profilePicture ||
                        'https://via.placeholder.com/100?text=Profile'
                      }
                      alt="Profile"
                      className="w-24 h-24 rounded-full object-cover"
                      onError={(e) => {
                        console.log('Image failed to load:', e.target.src);
                        e.target.src = 'https://via.placeholder.com/100?text=Profile';
                      }}
                    />
                    {isEditing && (
                      <label
                        htmlFor="profilePicture"
                        className="absolute bottom-0 right-0 bg-havanaBlue text-white p-1 rounded-full cursor-pointer"
                        aria-label="Upload profile picture"
                      >
                        <BiCamera className="text-lg" />
                        <input
                          id="profilePicture"
                          type="file"
                          accept="image/jpeg,image/png"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                </motion.div>
                <motion.div variants={childVariants}>
                  <label className="block text-[15px] sm:text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-[15px] sm:text-sm"
                    aria-readonly="true"
                  />
                </motion.div>
                <motion.div variants={childVariants}>
                  <label className="block text-[15px] sm:text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm bg-gray-100 text-[15px] sm:text-sm"
                    aria-readonly="true"
                  />
                </motion.div>
                <motion.div variants={childVariants}>
                  <label className="block text-[15px] sm:text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={profile.fullName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-[15px] sm:text-sm disabled:bg-gray-100"
                    aria-required={isEditing}
                  />
                </motion.div>
                <motion.div variants={childVariants}>
                  <label className="block text-[15px] sm:text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-[15px] sm:text-sm disabled:bg-gray-100"
                    placeholder="+6281234567890"
                    aria-required={isEditing}
                  />
                </motion.div>
                <motion.div variants={childVariants}>
                  <label className="block text-[15px] sm:text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-[15px] sm:text-sm disabled:bg-gray-100"
                    rows="3"
                    aria-required={isEditing}
                  />
                </motion.div>
                {isEditing ? (
                  <motion.div
                    className="flex space-x-2"
                    variants={childVariants}
                  >
                    <button
                      type="submit"
                      className="flex-1 bg-havanaBlue text-white py-2 px-4 rounded-md hover:bg-blue-700 text-[15px] sm:text-sm transition-colors duration-200"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 text-[15px] sm:text-sm transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="w-full bg-havanaBlue text-white py-2 px-4 rounded-md hover:bg-blue-700 text-[15px] sm:text-sm transition-colors duration-200"
                    variants={childVariants}
                  >
                    Edit Profile
                  </motion.button>
                )}
              </motion.form>
            ) : (
              <motion.p
                className="text-gray-600 text-[15px] sm:text-sm"
                variants={childVariants}
              >
                Profile management is only available for customers.
              </motion.p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ProfileModal;