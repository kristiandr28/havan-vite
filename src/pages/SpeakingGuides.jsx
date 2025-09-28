import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BiX, BiEdit, BiTrash } from 'react-icons/bi';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

function SpeakingGuides() {
  const [guides, setGuides] = useState([]);
  const [selectedGuide, setSelectedGuide] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let user = null;

  if (token) {
    try {
      user = jwtDecode(token);
    } catch (err) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  const BACKEND_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const fetchGuides = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/speaking-guides`);
        setGuides(response.data);
      } catch (err) {
        console.error('Fetch guides error:', err);
      }
    };
    fetchGuides();
  }, []);

  const openModal = (guide) => {
    setSelectedGuide(guide);
    setModalOpen(true);
  };

  const closeModal = () => {
    setSelectedGuide(null);
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this guide?')) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/speaking-guides/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setGuides(guides.filter((guide) => guide._id !== id));
      closeModal();
    } catch (err) {
      console.error('Delete guide error:', err);
      alert('Failed to delete guide');
    }
  };

  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  return (
    <div className="pt-20 pb-12 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-havanaGray mb-8 text-center">
          Speaking Guides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map((guide) => (
            <motion.div
              key={guide._id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.03 }}
              onClick={() => openModal(guide)}
            >
              <img
                src={guide.image || 'https://via.placeholder.com/400x200'}
                alt={guide.name}
                className="w-full h-48 object-cover"
              />
              <div className="p-4">
                <h3 className="text-lg font-semibold text-havanaGray">
                  {guide.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {guide.description}
                </p>
                <p className="text-havanaBlue font-medium mt-2">
                  Rp {guide.price.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Languages: {guide.language.join(', ')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <AnimatePresence>
          {modalOpen && selectedGuide && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999]"
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={closeModal}
            >
              <motion.div
                className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md shadow-lg z-[10000] max-h-[80vh] overflow-y-auto"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-base sm:text-lg font-semibold text-havanaGray">
                    {selectedGuide.name}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-600 hover:text-gray-800"
                    aria-label="Close guide modal"
                  >
                    <BiX className="text-xl" />
                  </button>
                </div>
                <img
                  src={selectedGuide.image || 'https://via.placeholder.com/400x200'}
                  alt={selectedGuide.name}
                  className="w-full h-48 object-cover rounded-md mb-4"
                />
                <p className="text-[15px] sm:text-sm text-gray-600 mb-4">
                  {selectedGuide.description}
                </p>
                <p className="text-havanaBlue font-medium text-[15px] sm:text-sm mb-2">
                  Rp {selectedGuide.price.toLocaleString()}
                </p>
                <p className="text-[15px] sm:text-sm text-gray-600 mb-4">
                  Languages: {selectedGuide.language.join(', ')}
                </p>
                {user && user.role === 'admin' && (
                  <div className="flex space-x-4">
                    <button
                      onClick={() => navigate(`/admin/speaking-guides/edit/${selectedGuide._id}`)}
                      className="flex items-center bg-havanaBlue text-white py-2 px-4 rounded-md hover:bg-blue-700 text-[15px] sm:text-sm"
                    >
                      <BiEdit className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(selectedGuide._id)}
                      className="flex items-center bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 text-[15px] sm:text-sm"
                    >
                      <BiTrash className="mr-1" />
                      Delete
                    </button>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default SpeakingGuides;