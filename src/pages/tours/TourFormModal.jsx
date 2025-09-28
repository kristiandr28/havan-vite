import React, { useEffect, useCallback } from 'react';
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

function TourFormModal({
  isOpen, onClose, isEdit, currentTour, setCurrentTour, imagePreview, setImagePreview,
  imageError, setImageError, formErrors, setFormErrors, languages, destinations,
  includedItems, excludedItems, BACKEND_URL, authToken, fetchTours, setError, handleLogout,
  lang ="en"
}) {

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

    const getTranslation = (translations, langCode) => {
      if (!translations || !Array.isArray(translations)) return null;
      return translations.find(t => t.language?.code === langCode || t.language === langCode) || translations[0];
    };

    const getDestinationLabel = useCallback((dest) => {
      const defaultTranslation = getTranslation(dest.translations, lang);
      return defaultTranslation ? defaultTranslation.name : 'No Name';
    }, [lang]);

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setCurrentTour(prev => ({ ...prev, [name]: value }));
  }, [setCurrentTour]);

  const handleTranslationChange = useCallback((index, field, value) => {
    const newTranslations = [...(currentTour.translations || [])];
    newTranslations[index] = { ...newTranslations[index], [field]: value };
    setCurrentTour(prev => ({ ...prev, translations: newTranslations }));
  }, [currentTour, setCurrentTour]);

  const addTranslationField = useCallback(() => {
    setCurrentTour(prev => ({
      ...prev,
      translations: [...(prev.translations || []), { language: '', name: '', description: '' }]
    }));
  }, [setCurrentTour]);

  const removeTranslationField = useCallback((index) => {
    const newTranslations = (currentTour.translations || []).filter((_, i) => i !== index);
    setCurrentTour(prev => ({ ...prev, translations: newTranslations }));
  }, [currentTour, setCurrentTour]);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image size must be less than 5MB');
        setImagePreview(null);
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        setImageError('Only JPEG and PNG images are allowed');
        setImagePreview(null);
        return;
      }
      setImageError('');
      setCurrentTour(prev => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    } else {
      setCurrentTour(prev => ({ ...prev, image: null }));
      setImagePreview(null);
      setImageError('');
    }
  }, [setCurrentTour, setImagePreview, setImageError]);

  const handleSelectChange = useCallback((selectedOptions, field) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setCurrentTour(prev => ({ ...prev, [field]: values }));
  }, [setCurrentTour]);

  const handleItineraryTranslationChange = useCallback((itemIndex, transIndex, field, value) => {
    const newItinerary = [...(currentTour.itinerary || [])];
    const newTranslations = [...(newItinerary[itemIndex].translations || [])];
    newTranslations[transIndex] = { ...newTranslations[transIndex], [field]: value };
    newItinerary[itemIndex] = { ...newItinerary[itemIndex], translations: newTranslations };
    setCurrentTour(prev => ({ ...prev, itinerary: newItinerary }));
}, [currentTour, setCurrentTour]);

  const addItinerary = useCallback(() => {
    setCurrentTour(prev => ({
        ...prev,
        itinerary: [...(prev.itinerary || []), {
            translations: languages.map(lang => ({ language: lang.code, title: '', description: '' }))
        }]
    }));
}, [setCurrentTour, languages]);

  const removeItinerary = useCallback((index) => {
    const newItinerary = (currentTour.itinerary || []).filter((_, i) => i !== index);
    setCurrentTour(prev => ({ ...prev, itinerary: newItinerary }));
  }, [currentTour, setCurrentTour]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');

    if (imageError) {
      setError('Please fix the errors in the form before submitting.');
      return;
    }

    const newFormErrors = {};
    if (!currentTour.translations || currentTour.translations.length === 0) {
      newFormErrors.translations = 'At least one translation is required.';
    } else {
      currentTour.translations.forEach((t, index) => {
        if (!t.language) newFormErrors[`translations[${index}].language`] = 'Language is required.';
        if (!t.name) newFormErrors[`translations[${index}].name`] = 'Name is required.';
        if (!t.description) newFormErrors[`translations[${index}].description`] = 'Description is required.';
      });
    }

    (currentTour.itinerary || []).forEach((item, itemIndex) => {
        if (!item.translations || item.translations.length === 0) {
            newFormErrors[`itinerary[${itemIndex}].translations`] = 'At least one translation is required for this itinerary item.';
        } else {
            item.translations.forEach((t, transIndex) => {
                if (!t.language) newFormErrors[`itinerary[${itemIndex}].translations[${transIndex}].language`] = 'Language is required.';
                if (!t.title) newFormErrors[`itinerary[${itemIndex}].translations[${transIndex}].title`] = 'Title is required.';
                if (!t.description) newFormErrors[`itinerary[${itemIndex}].translations[${transIndex}].description`] = 'Description is required.';
            });
        }
    });

    if (!currentTour.price || parseFloat(currentTour.price) <= 0) newFormErrors.price = 'Price must be a positive number.';
    if (!currentTour.duration) newFormErrors.duration = 'Duration is required.';
    if (!currentTour.maxPax || parseInt(currentTour.maxPax) < 1 || parseInt(currentTour.maxPax) > 10) newFormErrors.maxPax = 'Max Pax must be between 1 and 10.';
    if (!currentTour.tourType) newFormErrors.tourType = 'Tour Type is required.';
    if (!isEdit && !currentTour.image) newFormErrors.image = 'Image is required for new tours.';

    if (Object.keys(newFormErrors).length > 0) {
      setFormErrors(newFormErrors);
      setError('Please fix the errors in the form.');
      return;
    }

    const formData = new FormData();
    formData.append('translations', JSON.stringify(currentTour.translations));
    formData.append('price', parseFloat(currentTour.price) || 0);
    formData.append('duration', currentTour.duration);
    formData.append('maxPax', parseInt(currentTour.maxPax) || 1);
    formData.append('tourType', currentTour.tourType);

    // Perbaikan: Kirim array sebagai item terpisah
    (currentTour.guideLanguages || []).forEach(langId => {
      formData.append('guideLanguages', langId);
    });
    (currentTour.destinations || []).forEach(destId => {
      formData.append('destinations', destId);
    });
    formData.append('itinerary', JSON.stringify(currentTour.itinerary || []));
    (currentTour.included || []).forEach(itemId => {
      formData.append('included', itemId);
    });
    (currentTour.excluded || []).forEach(itemId => {
      formData.append('excluded', itemId);
    });

    if (currentTour.image) {
      formData.append('image', currentTour.image);
    }

    try {
      if (isEdit) {
        await axios.put(`${BACKEND_URL}/api/tours/${currentTour._id}`, formData, {
          headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await axios.post(`${BACKEND_URL}/api/tours`, formData, {
          headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'multipart/form-data' }
        });
      }
      fetchTours();
      onClose();
    } catch (err) {
      handleApiError(err, 'Failed to save tour', handleLogout, setError);
    }
  }, [isEdit, currentTour, imageError, BACKEND_URL, authToken, fetchTours, onClose, setError, setFormErrors, handleLogout]);

  const maxPaxOptions = Array.from({ length: 10 }, (_, i) => ({ value: (i + 1).toString(), label: i + 1 }));
  const tourTypeOptions = [{ value: '', label: 'Select Tour Type' }, { value: 'Full Day', label: 'Full Day' }, { value: 'Half Day', label: 'Half Day' }];
  const languageOptions = (languages || []).map(lang => ({ value: lang._id, label: `${lang.name} (${lang.code})` }));
  const destinationOptions = (destinations || []).map(dest => ({
    value: dest._id,
    label: getDestinationLabel(dest)
  }));
  const includedOptions = (includedItems || []).map(item => ({ value: item._id, label: item.name }));
  const excludedOptions = (excludedItems || []).map(item => ({ value: item._id, label: item.name }));

  if (!isOpen || !currentTour) return null;

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
          <h3 className="text-lg sm:text-xl font-semibold text-havanaGray mb-4">{isEdit ? 'Edit Tour' : 'Add Tour'}</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Translations</label>
              {formErrors.translations && <p className="text-red-500 text-xs mt-1">{formErrors.translations}</p>}
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                {(currentTour.translations || []).map((t, index) => (
                  <div key={index} className="border p-3 mb-2 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <h4 className="text-sm font-medium">Translation {index + 1}</h4>
                      <button type="button" onClick={() => removeTranslationField(index)} className="text-red-500 hover:text-red-700 text-base sm:text-lg"><BiTrash /></button>
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor={`translationLang-${index}`} className="block text-xs sm:text-sm font-medium text-gray-700">Language</label>
                        <select
                          id={`translationLang-${index}`}
                          value={t.language}
                          onChange={(e) => handleTranslationChange(index, 'language', e.target.value)}
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
                        <label htmlFor={`translationName-${index}`} className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                        <input
                          id={`translationName-${index}`}
                          type="text"
                          value={t.name}
                          onChange={(e) => handleTranslationChange(index, 'name', e.target.value)}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                          maxLength={50}
                          required
                        />
                        {formErrors[`translations[${index}].name`] && <p className="text-red-500 text-xs mt-1">{formErrors[`translations[${index}].name`]}</p>}
                      </div>
                    </div>
                    <div className="mt-2">
                      <label htmlFor={`translationDesc-${index}`} className="block text-xs sm:text-sm font-medium text-gray-700">Description</label>
                      <textarea
                        id={`translationDesc-${index}`}
                        value={t.description}
                        onChange={(e) => handleTranslationChange(index, 'description', e.target.value)}
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
              <button type="button" onClick={addTranslationField} className="flex items-center text-havanaBlue hover:text-blue-700 mt-2 text-sm sm:text-base transition"><BiPlus className="mr-1" />Add Translation</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="tourPrice" className="block text-sm font-medium text-gray-700">Price (IDR)</label>
                  <input id="tourPrice" type="number" name="price" value={currentTour.price} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue" required />
                  {formErrors.price && <p className="text-red-500 text-xs mt-1">{formErrors.price}</p>}
                </div>
                <div>
                  <label htmlFor="tourDuration" className="block text-sm font-medium text-gray-700">Duration</label>
                  <input id="tourDuration" type="text" name="duration" value={currentTour.duration} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue" placeholder="e.g., 3 days 2 nights" required />
                  {formErrors.duration && <p className="text-red-500 text-xs mt-1">{formErrors.duration}</p>}
                </div>
                <div>
                  <label htmlFor="tourMaxPax" className="block text-sm font-medium text-gray-700">Max Pax (Person)</label>
                  <select id="tourMaxPax" name="maxPax" value={currentTour.maxPax} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue" required>
                    {maxPaxOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {formErrors.maxPax && <p className="text-red-500 text-xs mt-1">{formErrors.maxPax}</p>}
                </div>
                <div>
                  <label htmlFor="tourType" className="block text-sm font-medium text-gray-700">Tour Type</label>
                  <select id="tourType" name="tourType" value={currentTour.tourType} onChange={handleInputChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue" required>
                    {tourTypeOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  {formErrors.tourType && <p className="text-red-500 text-xs mt-1">{formErrors.tourType}</p>}
                </div>
                <div>
                  <label htmlFor="tourImage" className="block text-sm font-medium text-gray-700">Image</label>
                  <input id="tourImage" type="file" accept="image/jpeg,image/png" onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-havanaBlue hover:file:bg-blue-100" />
                  {imageError && <p className="text-red-500 text-xs sm:text-sm mt-1">{imageError}</p>}
                  {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 h-24 w-24 sm:h-32 sm:w-32 object-cover rounded" onError={(e) => { e.target.src = 'https://placehold.co/128x128/cccccc/ffffff?text=No+Preview'; }} />}
                  {!imagePreview && isEdit && currentTour.image && <div className="mt-2"><img src={`${BACKEND_URL}${currentTour.image}`} alt="Current Tour" className="h-24 w-24 sm:h-32 sm:w-32 object-cover rounded" onError={(e) => { e.target.src = 'https://placehold.co/128x128/cccccc/ffffff?text=No+Image'; }} /></div>}
                  {formErrors.image && <p className="text-red-500 text-xs mt-1">{formErrors.image}</p>}
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="guideLanguages" className="block text-sm font-medium text-gray-700">Guide Languages</label>
                  <Select id="guideLanguages" isMulti options={languageOptions} value={languageOptions.filter(option => (currentTour.guideLanguages || []).includes(option.value))} onChange={(selected) => handleSelectChange(selected, 'guideLanguages')} className="mt-1 text-sm sm:text-base" placeholder="Select languages..." />
                </div>
                <div>
                  <label htmlFor="tourDestinations" className="block text-sm font-medium text-gray-700">Destinations</label>
                  <Select id="tourDestinations" isMulti options={destinationOptions} value={destinationOptions.filter(option => (currentTour.destinations || []).includes(option.value))} onChange={(selected) => handleSelectChange(selected, 'destinations')} className="mt-1 text-sm sm:text-base" placeholder="Select destinations..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Itinerary</label>
                  {formErrors.itinerary && <p className="text-red-500 text-xs mt-1">{formErrors.itinerary}</p>}
                  <div className="max-h-40 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                    {(currentTour.itinerary || []).map((item, itemIndex) => (
                      <div key={itemIndex} className="border p-3 mb-2 rounded-md bg-gray-50">
                        <div className="flex justify-between items-center"><h4 className="text-sm font-medium">Item {itemIndex + 1}</h4><button type="button" onClick={() => removeItinerary(itemIndex)} className="text-red-500 hover:text-red-700 text-base sm:text-lg"><BiTrash /></button></div>
                        <div className="mt-2 space-y-2">
                           {(item.translations || []).map((t, transIndex) => (
                            <div key={transIndex} className="border p-2 rounded-md bg-white">
                                <h5 className="text-xs font-medium text-gray-600">Terjemahan {transIndex + 1}</h5>
                                <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <div>
                                        <label htmlFor={`itineraryLang-${itemIndex}-${transIndex}`} className="block text-xs font-medium text-gray-700">Language</label>
                                        <select
                                            id={`itineraryLang-${itemIndex}-${transIndex}`}
                                            value={t.language}
                                            onChange={(e) => handleItineraryTranslationChange(itemIndex, transIndex, 'language', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-xs focus:ring-havanaBlue focus:border-havanaBlue"
                                        >
                                            <option value="">Select Language</option>
                                            {(languages || []).map(lang => (
                                                <option key={lang.code} value={lang.code}>{lang.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor={`itineraryTitle-${itemIndex}-${transIndex}`} className="block text-xs font-medium text-gray-700">Title</label>
                                        <input
                                            id={`itineraryTitle-${itemIndex}-${transIndex}`}
                                            type="text"
                                            value={t.title}
                                            onChange={(e) => handleItineraryTranslationChange(itemIndex, transIndex, 'title', e.target.value)}
                                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-xs focus:ring-havanaBlue focus:border-havanaBlue"
                                        />
                                    </div>
                                </div>
                                <div className="mt-2">
                                    <label htmlFor={`itineraryDesc-${itemIndex}-${transIndex}`} className="block text-xs font-medium text-gray-700">Description</label>
                                    <textarea
                                        id={`itineraryDesc-${itemIndex}-${transIndex}`}
                                        value={t.description}
                                        onChange={(e) => handleItineraryTranslationChange(itemIndex, transIndex, 'description', e.target.value)}
                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-xs focus:ring-havanaBlue focus:border-havanaBlue"
                                        rows="2"
                                    />
                                </div>
                            </div>
                           ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addItinerary} className="flex items-center text-havanaBlue hover:text-blue-700 mt-2 text-sm sm:text-base transition"><BiPlus className="mr-1" />Add Item</button>
                </div>
                <div>
                  <label htmlFor="includedItems" className="block text-sm font-medium text-gray-700">Included</label>
                  <Select id="includedItems" isMulti options={includedOptions} value={includedOptions.filter(option => (currentTour.included || []).includes(option.value))} onChange={(selected) => handleSelectChange(selected, 'included')} className="mt-1 text-sm sm:text-base" placeholder="Select included items..." />
                </div>
                <div>
                  <label htmlFor="excludedItems" className="block text-sm font-medium text-gray-700">Excluded</label>
                  <Select id="excludedItems" isMulti options={excludedOptions} value={excludedOptions.filter(option => (currentTour.excluded || []).includes(option.value))} onChange={(selected) => handleSelectChange(selected, 'excluded')} className="mt-1 text-sm sm:text-base" placeholder="Select excluded items..." />
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <button type="button" onClick={onClose} className="py-1.5 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm sm:text-base transition">Cancel</button>
              <button type="submit" className="py-1.5 px-3 bg-havanaBlue text-white rounded-md hover:bg-blue-700 text-sm sm:text-base transition">{isEdit ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default TourFormModal;