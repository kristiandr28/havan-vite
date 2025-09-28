import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BiX, BiPlus, BiTrash } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import axios from 'axios';

const modalVariants = {
  hidden: { y: "-100vh", opacity: 0 },
  visible: { y: "0", opacity: 1, transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 } },
  exit: { y: "100vh", opacity: 0 },
};

function DestinationFormModal({
  isOpen, onClose, isEdit, currentDestination, setCurrentDestination, imagePreview, setImagePreview,
  imageError, setImageError, formErrors, setFormErrors, locations,
  BACKEND_URL, authToken, fetchDestinations, handleApiError
}) {
  const [languages, setLanguages] = useState([]);

  const locationsOptions = useMemo(() => locations.map(loc => ({ value: loc._id, label: loc.name })), [locations]);

  const fetchLanguages = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/languages`);
      setLanguages(res.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch languages.');
    }
  }, [BACKEND_URL, handleApiError]);

  useEffect(() => {
    if (isOpen) {
      fetchLanguages();
    }
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, fetchLanguages, onClose]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentDestination(prev => ({ ...prev, [name]: value }));
  }, [setCurrentDestination]);

  const handleTranslationChange = useCallback((id, field, value) => {
    const newTranslations = (currentDestination.translations || []).map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    setCurrentDestination(prev => ({ ...prev, translations: newTranslations }));
  }, [currentDestination, setCurrentDestination]);

  const addTranslation = useCallback(() => {
    const newId = Date.now();
    setCurrentDestination(prev => ({
      ...prev,
      translations: [...(prev.translations || []), { id: newId, language: '', name: '', description: '' }]
    }));
  }, [setCurrentDestination]);

  const removeTranslation = useCallback((id) => {
    const newTranslations = (currentDestination.translations || []).filter(t => t.id !== id);
    setCurrentDestination(prev => ({ ...prev, translations: newTranslations }));
  }, [currentDestination, setCurrentDestination]);

  const handleSelectChange = useCallback((selectedOption, field) => {
    setCurrentDestination(prev => ({ ...prev, [field]: selectedOption ? selectedOption.value : '' }));
  }, [setCurrentDestination]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError('File size should not exceed 5MB.');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setImageError('Only JPEG and PNG images are allowed.');
        return;
      }
      setImageError('');
      setCurrentDestination(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentDestination(prev => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  }, [setCurrentDestination, setImageError, setImagePreview]);

  const validateForm = useCallback(() => {
    const errors = {};
    if (!currentDestination?.translations?.length) {
      errors.translations = 'At least one translation is required.';
    } else {
      currentDestination.translations.forEach((t, index) => {
        if (!t.language) errors[`translations[${index}].language`] = 'Language is required.';
        if (!t.name) errors[`translations[${index}].name`] = 'Name is required.';
        if (!t.description) errors[`translations[${index}].description`] = 'Description is required.';
      });
    }
    if (!currentDestination?.location) {
      errors.location = 'Location is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentDestination, setFormErrors]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append('translations', JSON.stringify(currentDestination.translations.map(({ id, ...rest }) => rest)));
    formData.append('locationId', currentDestination.location);
    
    if (currentDestination.image && typeof currentDestination.image !== 'string') {
      formData.append('image', currentDestination.image);
    }

    const endpoint = isEdit ? `${BACKEND_URL}/api/destinations/${currentDestination._id}` : `${BACKEND_URL}/api/destinations`;
    const method = isEdit ? 'put' : 'post';

    try {
      await axios[method](endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
      });
      fetchDestinations();
      onClose();
    } catch (err) {
      handleApiError(err, `Failed to ${isEdit ? 'update' : 'create'} destination.`);
    }
  }, [BACKEND_URL, authToken, isEdit, currentDestination, fetchDestinations, onClose, handleApiError, validateForm]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white rounded-lg p-6 w-full max-w-lg sm:max-w-3xl md:max-w-4xl lg:max-w-5xl min-h-[500px] max-h-[90vh] overflow-y-auto shadow-xl"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button type="button" onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl transition-colors" aria-label="Close modal"><BiX /></button>
          <h3 className="text-lg sm:text-xl font-semibold text-havanaBlue mb-4">{isEdit ? 'Edit Destination' : 'Add Destination'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Translations</label>
              {formErrors.translations && <p className="text-red-500 text-xs mt-1">{formErrors.translations}</p>}
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                {(currentDestination?.translations || []).map((t, index) => (
                  <div key={t.id} className="border p-3 mb-2 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Translation {index + 1}</h4>
                      <button type="button" onClick={() => removeTranslation(t.id)} className="text-red-500 hover:text-red-700 text-base sm:text-lg"><BiTrash /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`translationLang-${t.id}`} className="block text-xs sm:text-sm font-medium text-gray-700">Language</label>
                        <select
                          id={`translationLang-${t.id}`}
                          value={t.language}
                          onChange={(e) => handleTranslationChange(t.id, 'language', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                          required
                        >
                          <option value="">Select Language</option>
                          {(languages || []).map(lang => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                          ))}
                        </select>
                        {formErrors[`translations[${index}].language`] && <p className="text-red-500 text-xs mt-1">{formErrors[`translations[${index}].language`]}</p>}
                      </div>
                      <div>
                        <label htmlFor={`translationName-${t.id}`} className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                        <input
                          id={`translationName-${t.id}`}
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTranslationChange(t.id, 'name', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                          maxLength={50}
                          required
                        />
                        {formErrors[`translations[${index}].name`] && <p className="text-red-500 text-xs mt-1">{formErrors[`translations[${index}].name`]}</p>}
                      </div>
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`translationDesc-${t.id}`} className="block text-xs sm:text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id={`translationDesc-${t.id}`}
                        value={t.description}
                        onChange={(e) => handleTranslationChange(t.id, 'description', e.target.value)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                        rows="3"
                        maxLength={3000}
                        required
                      />
                      {formErrors[`translations[${index}].description`] && <p className="text-red-500 text-xs mt-1">{formErrors[`translations[${index}].description`]}</p>}
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={addTranslation} className="flex items-center text-havanaBlue hover:text-blue-700 mt-2 text-sm sm:text-base transition"><BiPlus className="mr-1" />Add Translation</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="destinationLocation" className="block text-sm font-medium text-gray-700">Location</label>
                  <Select
                    id="destinationLocation"
                    options={locationsOptions}
                    value={locationsOptions.find(opt => opt.value === currentDestination?.location) || null}
                    onChange={(selected) => handleSelectChange(selected, 'location')}
                    className="mt-1 text-sm sm:text-base"
                    placeholder="Select Location..."
                  />
                  {formErrors.location && <p className="text-red-500 text-xs mt-1">{formErrors.location}</p>}
                </div>
                <div>
                  <label htmlFor="destinationImage" className="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    id="destinationImage"
                    type="file"
                    name="image"
                    accept="image/jpeg, image/png"
                    onChange={handleImageChange}
                    className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-havanaBlue hover:file:bg-blue-100"
                  />
                  {imagePreview && (
                    <div className="mt-2 w-32 h-32 rounded-lg overflow-hidden border">
                      <img src={imagePreview} alt="Image Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {imageError && <p className="text-red-500 text-sm mt-1">{imageError}</p>}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="py-1.5 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm sm:text-base transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-1.5 px-3 bg-havanaBlue text-white rounded-md hover:bg-blue-700 text-sm sm:text-base transition"
              >
                {isEdit ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default DestinationFormModal;