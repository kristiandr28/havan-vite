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
const handleApiError = (err, defaultMessage, errorStateSetter) => {
  let errorMessage = defaultMessage;
  if (err.response) {
    errorMessage = err.response.data.message || `Error ${err.response.status}`;
  } else if (err.request) {
    errorMessage = 'No response from server. Check if backend is running.';
  } else {
    errorMessage = err.message;
  }
  errorStateSetter(errorMessage);
  console.error('API error:', err);
};

const ticketTypesOptions = [
  { value: 'One-Way', label: 'One-Way' },
  { value: 'Round-Trip', label: 'Round-Trip' },
];

function TicketFormModal({
  isEdit,
  currentTicket,
  closeModal,
  handleSubmit,
  destinations,
  locations,
  handleAddLocation,
  languages, // Menerima prop languages dari parent
  formErrors,
  setFormErrors,
}) {
  const [formData, setFormData] = useState({
    destination: '',
    ticketType: [],
    price: '',
    departureLocation: '',
    pax: '',
    translations: [],
  });
  const [error, setError] = useState('');
  const [newLocationName, setNewLocationName] = useState('');
  const [isAddingLocation, setIsAddingLocation] = useState(false);

  useEffect(() => {
    if (currentTicket) {
      // Pastikan translations adalah array, bahkan jika undefined
      const initialTranslations = currentTicket.translations || [];
      setFormData({
        destination: currentTicket.destination,
        ticketType: currentTicket.ticketType || [],
        price: currentTicket.price || '',
        departureLocation: currentTicket.departureLocation,
        pax: currentTicket.pax || '',
        translations: initialTranslations,
      });
    } else {
      setFormData({
        destination: '',
        ticketType: [],
        price: '',
        departureLocation: '',
        pax: '',
        translations: [],
      });
    }
  }, [currentTicket]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTranslationChange = (langId, field, value) => {
    setFormData(prev => ({
      ...prev,
      translations: (prev.translations || []).map(t =>
        (t.language._id || t.language) === langId
          ? { ...t, [field]: value }
          : t
      )
    }));
  };

  const handleSelectChange = (selectedOptions, name) => {
    if (name === 'ticketType') {
      setFormData(prev => ({ ...prev, [name]: selectedOptions.map(option => option.value) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: selectedOptions?.value || '' }));
    }
  };
  
  const handleTranslationLanguageChange = (index, e) => {
    const languageCode = e.target.value;
    const selectedLanguage = (languages || []).find(lang => lang.code === languageCode);
    
    // Perbarui objek terjemahan dengan ObjectId dari bahasa yang dipilih
    setFormData(prev => ({
        ...prev,
        translations: (prev.translations || []).map((t, i) =>
            i === index ? { ...t, language: selectedLanguage ? selectedLanguage._id : '' } : t
        )
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.destination) errors.destination = 'Destination is required.';
    if (formData.ticketType.length === 0) errors.ticketType = 'At least one ticket type is required.';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0) errors.price = 'Price must be a positive number.';
    if (!formData.departureLocation) errors.departureLocation = 'Departure Location is required.';
    if (!formData.pax || isNaN(formData.pax) || formData.pax <= 0) errors.pax = 'Pax must be a positive number.';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    handleSubmit(formData);
  };

  const onAddLocation = useCallback(async () => {
    if (newLocationName.trim() === '') {
      setError('Location name cannot be empty.');
      return;
    }
    setIsAddingLocation(true);
    setError('');
    try {
      const newLocation = await handleAddLocation(newLocationName);
      setFormData(prev => ({ ...prev, departureLocation: newLocation._id }));
      setNewLocationName('');
      setIsAddingLocation(false);
    } catch (err) {
      handleApiError(err, 'Failed to add location.', setError);
      setIsAddingLocation(false);
    }
  }, [newLocationName, handleAddLocation]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      onAddLocation();
    }
  }, [onAddLocation]);

  const handleAddTranslation = () => {
    setFormData(prev => ({
      ...prev,
      translations: [...(prev.translations || []), { language: '', description: '' }]
    }));
  };

  const handleRemoveTranslation = (index) => {
    setFormData(prev => ({
      ...prev,
      translations: (prev.translations || []).filter((_, i) => i !== index)
    }));
  };
  
  const availableLanguagesOptions = useMemo(() => {
    const usedLanguages = new Set((formData.translations || []).map(t => t.language._id || t.language).filter(id => id));
    return (languages || [])
      .filter(lang => !usedLanguages.has(lang._id))
      .map(lang => ({ value: lang._id, label: lang.name }));
  }, [formData.translations, languages]);

  const destinationOptions = destinations.map(d => ({ value: d._id, label: d.name }));
  const locationOptions = locations.map(l => ({ value: l._id, label: l.name }));

  const selectedDestinationOption = destinationOptions.find(opt => opt.value === formData.destination);
  const selectedLocationOption = locationOptions.find(opt => opt.value === formData.departureLocation);

  const selectedTicketTypeOptions = ticketTypesOptions.filter(opt => formData.ticketType.includes(opt.value));

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
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl transition-colors"
            aria-label="Close modal"
          >
            <BiX />
          </button>

          <h3 className="text-lg sm:text-xl font-semibold text-havanaBlue mb-4">{isEdit ? 'Edit Ticket' : 'Add New Ticket'}</h3>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline"> {error}</span>
            </div>
          )}
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700">Destination</label>
                  <Select
                    id="destination"
                    options={destinationOptions}
                    value={selectedDestinationOption}
                    onChange={(selected) => handleSelectChange(selected, 'destination')}
                    className="mt-1 text-sm sm:text-base"
                    placeholder="Select a destination..."
                  />
                  {formErrors.destination && <p className="mt-1 text-sm text-red-600">{formErrors.destination}</p>}
                </div>

                <div>
                  <label htmlFor="ticketType" className="block text-sm font-medium text-gray-700">Ticket Type</label>
                  <Select
                    id="ticketType"
                    isMulti
                    options={ticketTypesOptions}
                    value={selectedTicketTypeOptions}
                    onChange={(selected) => handleSelectChange(selected, 'ticketType')}
                    className="mt-1 text-sm sm:text-base"
                    placeholder="Select ticket types..."
                  />
                  {formErrors.ticketType && <p className="mt-1 text-sm text-red-600">{formErrors.ticketType}</p>}
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium text-gray-700">Price (IDR)</label>
                  <input
                    type="number"
                    name="price"
                    id="price"
                    value={formData.price}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                  />
                  {formErrors.price && <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="pax" className="block text-sm font-medium text-gray-700">Max Pax</label>
                  <input
                    type="number"
                    name="pax"
                    id="pax"
                    value={formData.pax}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                  />
                  {formErrors.pax && <p className="mt-1 text-sm text-red-600">{formErrors.pax}</p>}
                </div>

                <div>
                  <label htmlFor="departureLocation" className="block text-sm font-medium text-gray-700">Departure Location</label>
                  <Select
                    id="departureLocation"
                    options={locationOptions}
                    value={selectedLocationOption}
                    onChange={(selected) => handleSelectChange(selected, 'departureLocation')}
                    className="mt-1 text-sm sm:text-base"
                    placeholder="Select a departure location..."
                  />
                  {formErrors.departureLocation && <p className="mt-1 text-sm text-red-600">{formErrors.departureLocation}</p>}
                  <div className="flex items-center mt-2">
                    <input
                      type="text"
                      name="newLocation"
                      id="newLocation"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Or add a new location..."
                      className="block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                    />
                    <button
                      type="button"
                      onClick={onAddLocation}
                      disabled={isAddingLocation}
                      className="ml-2 py-1.5 px-3 bg-havanaBlue text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <BiPlus className="text-lg" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Translation panel */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">Translations</label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                {(formData.translations || []).map((translation, index) => (
                <div key={index} className="border p-3 mb-2 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium">Translation</h4>
                    <button
                        type="button"
                        onClick={() => handleRemoveTranslation(index)}
                        className="text-red-500 hover:text-red-700 transition"
                    >
                        <BiTrash />
                    </button>
                    </div>
                    <div className="mt-2 space-y-2">
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                        Select Language
                        </label>
                        <select
                        id={`translationLang-${index}`} // Menggunakan index sebagai kunci unik
                        value={translation.language._id || translation.language}
                        onChange={(e) => handleTranslationLanguageChange(index, e)}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                        required
                        >
                            <option value="">Select Language</option>
                            {(languages || []).map(lang => (
                                <option key={lang._id} value={lang._id}>{lang.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700">
                        Description
                        </label>
                        <textarea
                        name="description"
                        value={translation.description}
                        onChange={(e) => handleTranslationChange(translation.language._id || translation.language, 'description', e.target.value)}
                        rows="3"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                        ></textarea>
                    </div>
                    </div>
                </div>
                ))}
              </div>
              <div className="flex justify-center mt-2">
                <button
                  type="button"
                  onClick={handleAddTranslation}
                  className="flex items-center text-havanaBlue hover:text-blue-700 transition font-medium"
                >
                  <BiPlus className="mr-1" /> Add Translation
                </button>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
              <button
                type="button"
                onClick={closeModal}
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

export default TicketFormModal;
