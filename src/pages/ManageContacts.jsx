import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { BiPlus, BiEdit, BiTrash, BiX, BiLoaderAlt, BiCopy } from 'react-icons/bi';
import AdminHeader from '../components/AdminHeader';
import Sidebar from '../components/Sidebar';
import useAuth from '../hooks/useAuth';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants } from '../components/partials/modalVariants';

function ManageContacts() {
  const { user, isAuthenticated, isAuthReady, handleLogout } = useAuth();
  const navigate = useNavigate();

  const [contacts, setContacts] = useState([]);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // State for Add/Edit Contact modal
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentContact, setCurrentContact] = useState({
    _id: '',
    phone: '',
    email: '',
    whatsapp: '',
    address: '',
    socialMedia: { instagram: '', twitter: '', facebook: '', line: '', wechat: '' }
  });

  // State for Delete confirmation modal
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  // NOTE: Assuming BACKEND_URL and authToken are available via context or props
  // For this example, we'll use a placeholder
  const BACKEND_URL = import.meta.env.VITE_API_URL;
  const authToken = localStorage.getItem('authToken'); // Placeholder for authentication token

  // --- Authentication and Authorization ---
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

    fetchContacts();
  }, [isAuthenticated, user, isAuthReady, navigate, authToken]);

  

  const fetchContacts = useCallback(async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/contacts`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('Fetched contacts:', response.data.map(c => ({ _id: c._id, phone: c.phone })));
      setContacts(response.data);
    } catch (err) {
      setError('Failed to fetch contacts');
      console.error('Fetch contacts error:', err.response?.data?.message || err.message);
      if (err.response?.status === 401 || err.response?.status === 403) {
        handleLogout();
      }
    }
  }, [BACKEND_URL, authToken, handleLogout]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // --- Modal Add/Edit Contact ---
  const openFormModal = useCallback((contact = null) => {
    if (contact) {
      setIsEdit(true);
      setCurrentContact({
        _id: contact._id,
        phone: contact.phone,
        email: contact.email,
        whatsapp: contact.whatsapp || '',
        address: contact.address || '',
        socialMedia: {
          instagram: contact.socialMedia?.instagram || '',
          twitter: contact.socialMedia?.twitter || '',
          facebook: contact.socialMedia?.facebook || '',
          line: contact.socialMedia?.line || '',
          wechat: contact.socialMedia?.wechat || ''
        }
      });
    } else {
      setIsEdit(false);
      setCurrentContact({
        _id: '',
        phone: '',
        email: '',
        whatsapp: '',
        address: '',
        socialMedia: { instagram: '', twitter: '', facebook: '', line: '', wechat: '' }
      });
    }
    setFormModalOpen(true);
    setError('');
  }, []);

  const closeFormModal = useCallback(() => {
    setFormModalOpen(false);
    setError('');
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia.')) {
      const field = name.split('.')[1];
      setCurrentContact((prev) => ({
        ...prev,
        socialMedia: { ...prev.socialMedia, [field]: value }
      }));
    } else {
      setCurrentContact((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validateForm = useCallback(() => {
    if (!currentContact.phone || !/^\+?\d{8,15}$/.test(currentContact.phone))
      return 'Valid phone number is required (8-15 digits)';
    if (!currentContact.email || !/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(currentContact.email))
      return 'Valid email is required';
    if (currentContact.whatsapp && !/^\+?\d{8,15}$/.test(currentContact.whatsapp))
      return 'Valid WhatsApp number is required (8-15 digits)';
    if (!currentContact.address)
      return 'Address is required';
    return null;
  }, [currentContact]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    const data = {
      phone: currentContact.phone,
      email: currentContact.email,
      whatsapp: currentContact.whatsapp,
      address: currentContact.address,
      socialMedia: currentContact.socialMedia
    };

    try {
      if (isEdit) {
        const response = await axios.put(
          `${BACKEND_URL}/api/contacts/${currentContact._id}`,
          data,
          { headers: { Authorization: `Bearer ${authToken}` } }
        );
        setContacts(
          contacts.map((contact) =>
            contact._id === currentContact._id ? response.data : contact
          )
        );
        console.log('Updated contact:', currentContact.phone);
      } else {
        const response = await axios.post(`${BACKEND_URL}/api/contacts`, data, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setContacts([...contacts, response.data]);
        console.log('Created contact:', currentContact.phone);
      }
      closeFormModal();
    } catch (err) {
      setError(err.response?.data.message || 'Failed to save contact');
      console.error('Save contact error:', err.response?.data?.message || err.message);
    }
  }, [isEdit, currentContact, validateForm, BACKEND_URL, authToken, contacts, closeFormModal]);

  // --- Delete confirmation modal ---
  const openConfirmModal = useCallback((contact) => {
    setContactToDelete(contact);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setContactToDelete(null);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!contactToDelete) return;

    try {
      await axios.delete(`${BACKEND_URL}/api/contacts/${contactToDelete._id}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      setContacts(contacts.filter((contact) => contact._id !== contactToDelete._id));
      console.log('Deleted contact:', contactToDelete._id);
      closeConfirmModal();
    } catch (err) {
      setError(err.response?.data.message || 'Failed to delete contact');
      console.error('Delete contact error:', err.response?.data?.message || err.message);
      closeConfirmModal();
    }
  }, [contactToDelete, BACKEND_URL, authToken, contacts, closeConfirmModal]);

  const copyToClipboard = useCallback((text) => {
    // This is a browser function, and might not work in all environments.
    // For local testing, it's fine.
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        // In a real app, you would show a success message here, not an alert.
        console.log('ID copied to clipboard!');
      }, (err) => {
        console.error('Failed to copy text: ', err);
      });
    }
  }, []);


  if (!isAuthReady) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-havanaGray">
        <BiLoaderAlt className="animate-spin text-5xl mb-4 text-havanaBlue" />
        <p className="text-lg font-medium">Memuat autentikasi...</p>
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
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-havanaGray">Manage Contacts</h3>
              <button
                onClick={() => openFormModal()}
                className="flex items-center bg-havanaBlue text-white py-1.5 px-3 rounded-md hover:bg-blue-700 transition"
              >
                <BiPlus className="mr-1" />
                Add Contact
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {contacts.length === 0 && !error ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        No contacts found.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((contact) => (
                      <tr key={contact._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="flex items-center space-x-2">
                            <span>{contact._id.substring(0, 8)}...</span>
                            <button
                              onClick={() => copyToClipboard(contact._id)}
                              className="text-gray-400 hover:text-gray-600 transition"
                              aria-label="Copy ID to clipboard"
                            >
                              <BiCopy />
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.phone}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {contact.address}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => openFormModal(contact)}
                            className="text-havanaBlue hover:text-blue-700 mr-4 transition"
                            aria-label={`Edit contact ${contact.phone}`}
                          >
                            <BiEdit className="text-lg" />
                          </button>
                          <button
                            onClick={() => openConfirmModal(contact)}
                            className="text-red-500 hover:text-red-700 transition"
                            aria-label={`Delete contact ${contact.phone}`}
                          >
                            <BiTrash className="text-lg" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal for Add/Edit Contact */}
        {formModalOpen &&
          createPortal(
            <AnimatePresence>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative bg-white rounded-lg p-6 w-full max-w-xl shadow-xl"
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button
                    onClick={closeFormModal}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close form modal"
                  >
                    <BiX className="text-2xl" />
                  </button>
                  <h3 className="text-lg font-semibold text-havanaGray mb-4">
                    {isEdit ? 'Edit Contact' : 'Add Contact'}
                  </h3>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                          <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={currentContact.phone}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            value={currentContact.email}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="whatsapp" className="block text-sm font-medium text-gray-700">WhatsApp</label>
                          <input
                            type="tel"
                            id="whatsapp"
                            name="whatsapp"
                            value={currentContact.whatsapp}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            placeholder="+62812..."
                          />
                        </div>
                        <div>
                          <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address</label>
                          <textarea
                            id="address"
                            name="address"
                            value={currentContact.address}
                            onChange={handleInputChange}
                            rows="3"
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            required
                          ></textarea>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="block text-sm font-medium text-gray-700">Social Media (Full URLs)</p>
                        <div>
                          <label htmlFor="instagram" className="block text-sm font-medium text-gray-700">Instagram</label>
                          <input
                            type="url"
                            id="instagram"
                            name="socialMedia.instagram"
                            value={currentContact.socialMedia.instagram}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            placeholder="https://instagram.com/username"
                          />
                        </div>
                        <div>
                          <label htmlFor="twitter" className="block text-sm font-medium text-gray-700">Twitter</label>
                          <input
                            type="url"
                            id="twitter"
                            name="socialMedia.twitter"
                            value={currentContact.socialMedia.twitter}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            placeholder="https://twitter.com/username"
                          />
                        </div>
                        <div>
                          <label htmlFor="facebook" className="block text-sm font-medium text-gray-700">Facebook</label>
                          <input
                            type="url"
                            id="facebook"
                            name="socialMedia.facebook"
                            value={currentContact.socialMedia.facebook}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            placeholder="https://facebook.com/username"
                          />
                        </div>
                        <div>
                          <label htmlFor="line" className="block text-sm font-medium text-gray-700">Line</label>
                          <input
                            type="text"
                            id="line"
                            name="socialMedia.line"
                            value={currentContact.socialMedia.line}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            placeholder="Line ID"
                          />
                        </div>
                        <div>
                          <label htmlFor="wechatSocial" className="block text-sm font-medium text-gray-700">WeChat</label>
                          <input
                            type="text"
                            id="wechatSocial"
                            name="socialMedia.wechat"
                            value={currentContact.socialMedia.wechat}
                            onChange={handleInputChange}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue sm:text-sm"
                            placeholder="WeChat ID"
                          />
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4 border-t">
                      <button
                        type="button"
                        onClick={closeFormModal}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 transition"
                      >
                        {isEdit ? 'Update' : 'Create'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body
          )}

        {/* Delete confirmation modal */}
        {confirmModalOpen &&
          createPortal(
            <AnimatePresence>
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="relative bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-center"
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <button
                    onClick={closeConfirmModal}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                    aria-label="Close confirmation modal"
                  >
                    <BiX className="text-2xl" />
                  </button>
                  <h3 className="text-xl font-semibold text-red-600 mb-4">Konfirmasi Hapus</h3>
                  <p className="text-gray-700 mb-6">
                    Apakah Anda yakin ingin menghapus kontak <strong>{contactToDelete?.email || contactToDelete?.phone}</strong>?
                    Tindakan ini tidak dapat dibatalkan.
                  </p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={closeConfirmModal}
                      className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleDelete}
                      className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>,
            document.body
          )}
      </div>
    </div>
  );
}

export default ManageContacts;
