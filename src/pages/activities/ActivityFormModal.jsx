import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { BiX, BiPlus, BiTrash } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import Select from 'react-select';
import axios from 'axios';

// Animation variants for the modal using framer-motion
const modalVariants = {
  hidden: { y: "-100vh", opacity: 0 },
  visible: { y: "0", opacity: 1, transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 } },
  exit: { y: "100vh", opacity: 0 },
};

// Centralized API error handling function
const handleApiError = (err, defaultMessage, logoutCallback, errorStateSetter) => {
  let errorMessage = defaultMessage;
  if (err.response) {
    errorMessage = err.response.data.message || `Error ${err.response.status}`;
    if (err.response.status === 401 || err.response.status === 403) {
      logoutCallback();
    }
  } else if (err.request) {
    errorMessage = 'No response from server. Check if backend is running.';
  } else {
    errorMessage = err.message;
  }
  errorStateSetter(errorMessage);
  console.error('API error:', err);
};

/**
 * A modal form component for adding and editing activities.
 * It fetches languages from the backend and handles all form logic.
 */
function ActivityFormModal({
  isOpen, onClose, isEdit, currentActivity, setCurrentActivity, imagePreview, setImagePreview,
  imageError, setImageError, formErrors, setFormErrors, categories, includedItems, excludedItems,
  BACKEND_URL, authToken, fetchActivities, setError, handleLogout
}) {
  const [languages, setLanguages] = useState([]);

  // Memoize options for react-select to prevent re-creation on every render
  const categoriesOptions = useMemo(() => categories.map(c => ({ value: c._id, label: c.name })), [categories]);
  const includedOptions = useMemo(() => includedItems.map(i => ({ value: i._id, label: i.name })), [includedItems]);
  const excludedOptions = useMemo(() => excludedItems.map(e => ({ value: e._id, label: e.name })), [excludedItems]);

  // Fetches languages from the backend API
  const fetchLanguages = useCallback(async () => {
    try {
      const res = await axios.get(`${BACKEND_URL}/api/languages`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setLanguages(res.data);
    } catch (err) {
      handleApiError(err, 'Failed to fetch languages.', handleLogout, setError);
    }
  }, [BACKEND_URL, handleLogout, setError, authToken]);

  // Effect to fetch languages when the modal opens and handle keyboard events
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

  // Handles changes for simple input fields (e.g., price, duration, pax)
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentActivity(prev => ({ ...prev, [name]: value }));
  }, [setCurrentActivity]);

  // Handles changes for translation fields using a unique ID
  const handleTranslationChange = useCallback((id, field, value) => {
    const newTranslations = (currentActivity.translations || []).map(t =>
      t.id === id ? { ...t, [field]: value } : t
    );
    setCurrentActivity(prev => ({ ...prev, translations: newTranslations }));
  }, [currentActivity, setCurrentActivity]);

  // Adds a new, empty translation block with a unique ID
  const addTranslation = useCallback(() => {
    const newId = Date.now();
    setCurrentActivity(prev => ({
      ...prev,
      translations: [...(prev.translations || []), { id: newId, language: '', name: '', description: '' }]
    }));
  }, [setCurrentActivity]);

  // Removes a translation block based on its unique ID
  const removeTranslation = useCallback((id) => {
    const newTranslations = (currentActivity.translations || []).filter(t => t.id !== id);
    setCurrentActivity(prev => ({ ...prev, translations: newTranslations }));
  }, [currentActivity, setCurrentActivity]);

  // Handles changes for react-select dropdowns
  const handleSelectChange = useCallback((selectedOptions, field) => {
    let values;
    if (field === 'category') {
      values = selectedOptions ? selectedOptions.value : '';
    } else {
      values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    }
    setCurrentActivity(prev => ({ ...prev, [field]: values }));
  }, [setCurrentActivity]);

  // Handles changes for the image file input, including client-side validation
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
      setCurrentActivity(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setCurrentActivity(prev => ({ ...prev, image: null }));
      setImagePreview(null);
    }
  }, [setCurrentActivity, setImageError, setImagePreview]);

  // Validates the form fields and updates the formErrors state
  const validateForm = useCallback(() => {
    const errors = {};
    if (!currentActivity?.translations?.length) {
      errors.translations = 'At least one translation is required.';
    } else {
      currentActivity.translations.forEach((t, index) => {
        if (!t.language) errors[`translations[${index}].language`] = 'Language is required.';
        if (!t.name) errors[`translations[${index}].name`] = 'Name is required.';
        if (!t.description) errors[`translations[${index}].description`] = 'Description is required.';
      });
    }
    if (!currentActivity?.category) {
      errors.category = 'Category is required.';
    }
    if (!currentActivity?.price) {
      errors.price = 'Price is required.';
    }
    if (!currentActivity?.pax) {
      errors.pax = 'Max Pax is required.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [currentActivity, setFormErrors]);

  // Handles form submission, including validation and API calls
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    const formData = new FormData();
    formData.append('translations', JSON.stringify(currentActivity.translations.map(({ id, ...rest }) => rest))); // Remove temp 'id'
    formData.append('category', currentActivity.category);
    formData.append('price', currentActivity.price);
    formData.append('duration', currentActivity.duration || '');

    (currentActivity.included || []).forEach(item => {
      formData.append('included', item);
    });
    (currentActivity.excluded || []).forEach(item => {
      formData.append('excluded', item);
    });

    formData.append('pax', currentActivity.pax);
    if (currentActivity.image && typeof currentActivity.image !== 'string') {
      formData.append('image', currentActivity.image);
    }

    const endpoint = isEdit ? `${BACKEND_URL}/api/activities/${currentActivity._id}` : `${BACKEND_URL}/api/activities`;
    const method = isEdit ? 'put' : 'post';

    try {
      await axios[method](endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${authToken}`,
        },
      });
      fetchActivities();
      onClose();
    } catch (err) {
      handleApiError(err, `Failed to ${isEdit ? 'update' : 'create'} activity.`, handleLogout, setError);
    }
  }, [BACKEND_URL, authToken, isEdit, currentActivity, fetchActivities, onClose, handleLogout, setError, validateForm]);

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
          <h3 className="text-lg sm:text-xl font-semibold text-havanaBlue mb-4">{isEdit ? 'Edit Activity' : 'Add Activity'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Translations</label>
              {formErrors.translations && <p className="text-red-500 text-xs mt-1">{formErrors.translations}</p>}
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                {(currentActivity?.translations || []).map((t, index) => (
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
                  <label htmlFor="activityCategory" className="block text-sm font-medium text-gray-700">Category</label>
                  <Select
                    id="activityCategory"
                    options={categoriesOptions}
                    value={categoriesOptions.find(opt => opt.value === currentActivity?.category) || null}
                    onChange={(selected) => handleSelectChange(selected, 'category')}
                    className="mt-1 text-sm sm:text-base"
                    placeholder="Select Category..."
                  />
                  {formErrors.category && <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>}
                </div>
                <div>
                  <label htmlFor="activityPrice" className="block text-sm font-medium text-gray-700">Price</label>
                  <input
                    id="activityPrice"
                    type="number"
                    name="price"
                    value={currentActivity?.price || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                    required
                  />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label htmlFor="activityDuration" className="block text-sm font-medium text-gray-700">Duration (optional)</label>
                  <input
                    id="activityDuration"
                    type="text"
                    name="duration"
                    value={currentActivity?.duration || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                  />
                </div>
                <div>
                  <label htmlFor="activityPax" className="block text-sm font-medium text-gray-700">Max Pax</label>
                  <input
                    id="activityPax"
                    type="number"
                    name="pax"
                    value={currentActivity?.pax || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                    required
                  />
                  {formErrors.pax && <p className="text-red-500 text-xs mt-1">{formErrors.pax}</p>}
                </div>
                <div>
                  <label htmlFor="activityImage" className="block text-sm font-medium text-gray-700">Image</label>
                  <input
                    id="activityImage"
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
              <div className="space-y-4">
                <div>
                  <label htmlFor="includedItems" className="block text-sm font-medium text-gray-700">Included</label>
                  <Select 
                    id="includedItems" 
                    isMulti 
                    options={includedOptions} 
                    value={includedOptions.filter(option => (currentActivity.included || []).includes(option.value))} 
                    onChange={(selected) => handleSelectChange(selected, 'included')} 
                    className="mt-1 text-sm sm:text-base" 
                    placeholder="Select included items..." />
                </div>
                <div>
                  <label htmlFor="excludedItems" className="block text-sm font-medium text-gray-700">Excluded</label>
                  <Select
                    id="excludedItems"
                    isMulti
                    options={excludedOptions}
                    value={excludedOptions.filter(option => (currentActivity.excluded || []).includes(option.value))}
                    onChange={(selected) => handleSelectChange(selected, 'excluded')}
                    className="mt-1 text-sm sm:text-base"
                    placeholder="Select excluded items..."
                  />
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

export default ActivityFormModal;