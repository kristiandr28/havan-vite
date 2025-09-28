import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { BiPlus, BiEdit, BiTrash } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';

function ManageAbout() {
  const [abouts, setAbouts] = useState([]);
  const [error, setError] = useState('');
  const [companyNameError, setCompanyNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageError, setImageError] = useState('');
  const [currentAbout, setCurrentAbout] = useState({
    _id: '',
    companyName: '',
    description: '',
    mission: '',
    vision: '',
    image: null
  });
  const navigate = useNavigate();
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const user = jwtDecode(token);
    if (user.role !== 'admin') {
      navigate('/');
      return;
    }

    fetchAbouts();
  }, [navigate]);

  const fetchAbouts = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/about`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAbouts(response.data);
    } catch (err) {
      setError('Failed to fetch about entries');
      console.error('Fetch about error:', err);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const openModal = (about = null) => {
    if (about) {
      setIsEdit(true);
      const imageUrl = about.image ? `${BACKEND_URL}${about.image}` : null;
      setCurrentAbout({
        ...about,
        image: null // Do not pre-fill image input
      });
      setImagePreview(imageUrl);
      setCompanyNameError(about.companyName.length > 100 ? 'Company name must not exceed 100 characters' : '');
      setDescriptionError(about.description.length > 3000 ? 'Description must not exceed 3000 characters' : '');
    } else {
      setIsEdit(false);
      setCurrentAbout({
        _id: '',
        companyName: '',
        description: '',
        mission: '',
        vision: '',
        image: null
      });
      setImagePreview(null);
      setCompanyNameError('');
      setDescriptionError('');
    }
    setImageError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setImagePreview(null);
    setImageError('');
    setCompanyNameError('');
    setDescriptionError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAbout((prev) => ({ ...prev, [name]: value }));
    if (name === 'companyName') {
      setCompanyNameError(value.length > 100 ? 'Company name must not exceed 100 characters' : '');
    } else if (name === 'description') {
      setDescriptionError(value.length > 3000 ? 'Description must not exceed 3000 characters' : '');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image size must be less than 5MB');
        setCurrentAbout((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setImageError('Only JPEG and PNG images are allowed');
        setCurrentAbout((prev) => ({ ...prev, image: null }));
        setImagePreview(null);
        return;
      }
      setImageError('');
      setCurrentAbout((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      companyNameError ||
      descriptionError ||
      imageError ||
      !currentAbout.companyName ||
      !currentAbout.description
    ) {
      return;
    }

    const token = localStorage.getItem('token');
    try {
      const formData = new FormData();
      formData.append('companyName', currentAbout.companyName);
      formData.append('description', currentAbout.description);
      formData.append('mission', currentAbout.mission);
      formData.append('vision', currentAbout.vision);
      if (currentAbout.image) {
        formData.append('image', currentAbout.image);
      }

      if (isEdit) {
        const response = await axios.put(
          `${BACKEND_URL}/api/about/${currentAbout._id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setAbouts(abouts.map((about) => (about._id === currentAbout._id ? response.data : about)));
      } else {
        const response = await axios.post(`${BACKEND_URL}/api/about`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAbouts([...abouts, response.data]);
      }
      closeModal();
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save about entry');
      console.error('Submit error:', err.response?.data || err);
    }
  };

  const handleDelete = async (aboutId) => {
    if (!window.confirm('Are you sure you want to delete this about entry?')) return;
    try {
      await axios.delete(`${BACKEND_URL}/api/about/${aboutId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      setAbouts(abouts.filter((about) => about._id !== aboutId));
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete about entry');
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <div className="flex-1 md:ml-64">
        <AdminHeader toggleSidebar={toggleSidebar} />
        <div className="pt-20 max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
              <h3 className="text-xl sm:text-2xl font-semibold text-havanaGray mb-2 sm:mb-0">Manage About Us</h3>
              <button
                onClick={() => openModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 text-sm sm:text-base"
              >
                <BiPlus className="mr-1" />
                Add About Entry
              </button>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
              <table className="min-w-full w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[70px]">
                      Image
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px]">
                      Company Name
                    </th>
                    <th className="px-3 py-2 sm:px-6 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {abouts.map((about) => (
                    <tr key={about._id}>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm text-gray-900">
                        {about.image ? (
                          <img
                            src={`${BACKEND_URL}${about.image}`}
                            alt={about.companyName}
                            className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded"
                            onError={(e) => {
                              console.error(`Image load error for ${about.companyName}:`, `${BACKEND_URL}${about.image}`);
                              e.target.src = 'https://via.placeholder.com/40?text=No+Image';
                            }}
                          />
                        ) : (
                          <span className="text-xs sm:text-sm">No Image</span>
                        )}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {about.companyName}
                      </td>
                      <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openModal(about)}
                          className="text-havanaBlue hover:text-blue-700 mr-2 sm:mr-4 text-base sm:text-lg"
                        >
                          <BiEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(about._id)}
                          className="text-red-500 hover:text-red-700 text-base sm:text-lg"
                        >
                          <BiTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {modalOpen && (
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-[9999] p-4 sm:p-6"
            onClick={closeModal}
          >
            <div
              className="bg-white rounded-lg p-6 w-full max-w-lg sm:max-w-3xl md:max-w-4xl lg:max-w-5xl min-h-[500px] max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeModal}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl"
                aria-label="Close modal"
              >
                ×
              </button>
              <h3 className="text-lg sm:text-xl font-semibold text-havanaGray mb-4">
                {isEdit ? 'Edit About Entry' : 'Add About Entry'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company Name</label>
                    <input
                      id="companyName"
                      type="text"
                      name="companyName"
                      value={currentAbout.companyName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base"
                      maxLength={100}
                      required
                    />
                    {companyNameError && <p className="text-red-500 text-xs sm:text-sm mt-1">{companyNameError}</p>}
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={currentAbout.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base"
                      rows="5"
                      maxLength={3000}
                      required
                    />
                    {descriptionError && <p className="text-red-500 text-xs sm:text-sm mt-1">{descriptionError}</p>}
                  </div>
                  <div>
                    <label htmlFor="mission" className="block text-sm font-medium text-gray-700">Mission</label>
                    <textarea
                      id="mission"
                      name="mission"
                      value={currentAbout.mission}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base"
                      rows="3"
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <label htmlFor="vision" className="block text-sm font-medium text-gray-700">Vision</label>
                    <textarea
                      id="vision"
                      name="vision"
                      value={currentAbout.vision}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base"
                      rows="3"
                      maxLength={1000}
                    />
                  </div>
                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700">Image</label>
                    <input
                      id="image"
                      type="file"
                      accept="image/jpeg,image/png"
                      onChange={handleImageChange}
                      className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-havanaBlue hover:file:bg-blue-100"
                    />
                    {imageError && <p className="text-red-500 text-xs sm:text-sm mt-1">{imageError}</p>}
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="mt-2 h-24 w-24 sm:h-32 sm:w-32 object-cover rounded"
                        onError={(e) => {
                          console.error('Preview load error:', imagePreview);
                          e.target.src = 'https://via.placeholder.com/128?text=No+Preview';
                        }}
                      />
                    )}
                  </div>
                </div>
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="py-1.5 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="py-1.5 px-3 bg-havanaBlue text-white rounded-md hover:bg-blue-700 text-sm sm:text-base"
                  >
                    {isEdit ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManageAbout;