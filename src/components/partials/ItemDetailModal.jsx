import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { BiCalendar, BiMapPin, BiPhone, BiNote, BiX, BiCheck, BiUser } from 'react-icons/bi';
import { useTranslation } from 'react-i18next'; // Import useTranslation

// Define the animation variants for the modal and its content
const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const contentVariants = {
  hidden: { y: "100vh", opacity: 0 },
  visible: { y: "0", opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
  exit: { y: "100vh", opacity: 0, transition: { duration: 0.3 } },
};

function ItemDetailModal({
  isOpen,
  closeModal,
  item,
  activeCurrency,
  handleDetailSubmit,
  useSameDetails,
}) {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const today = new Date();
  const minDate = new Date(today);
  // Set minimum booking date to 7 days from now
  minDate.setDate(today.getDate() + 7);

  const initialDetail = {
    date: minDate,
    pickupLocation: '',
    name: '',
    phone: '',
    specialRequests: '',
  };

  const [details, setDetails] = useState(
    useSameDetails
      ? [initialDetail]
      : Array(item?.quantity || 1).fill().map(() => ({ ...initialDetail }))
  );
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState('');

  // Reset state when the modal opens or item changes
  useEffect(() => {
    if (isOpen) {
      console.log('ItemDetailModal: Rendered with z-index 10003, item:', item, 'useSameDetails:', useSameDetails);
      setDetails(
        useSameDetails
          ? [initialDetail]
          : Array(item?.quantity || 1).fill().map(() => ({ ...initialDetail }))
      );
      setActiveTab(0);
      setError('');
    }
  }, [isOpen, item, useSameDetails]);

  if (!isOpen || !item) return null;

  // Handle changes to text inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDetails((prev) => {
      const newDetails = [...prev];
      newDetails[activeTab] = { ...newDetails[activeTab], [name]: value };
      // If using the same details for all tickets, update all
      if (useSameDetails) {
        return [newDetails[activeTab]];
      }
      return newDetails;
    });
  };

  // Handle changes to the date picker
  const handleDateChange = (date) => {
    setDetails((prev) => {
      const newDetails = [...prev];
      newDetails[activeTab] = { ...newDetails[activeTab], date };
      if (useSameDetails) {
        return [newDetails[activeTab]];
      }
      return newDetails;
    });
  };

  // Check if a single detail object is complete
  const isDetailComplete = (detail) => {
    // A simple regex to check for a valid phone number format
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return (
      detail.date &&
      detail.name.trim() !== '' &&
      phoneRegex.test(detail.phone) &&
      // Pickup location is required for 'tour' items only
      (item.modalType !== 'tour' || detail.pickupLocation)
    );
  };

  // Check if all details for all tickets are complete
  const allDetailsComplete = details.every(isDetailComplete);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!item._id) {
      setError(t('checkoutModal.errors.invalidItem'));
      console.error('ItemDetailModal: Invalid item, missing _id:', item);
      return;
    }
    if (!allDetailsComplete) {
      setError(t('checkoutModal.errors.completeDetails'));
      return;
    }
    setError('');
    console.log('ItemDetailModal: Submitting details:', details);
    // Format the details before submitting
    const formattedDetails = details.map((d) => ({
      date: d.date.toISOString(),
      pickupLocation: d.pickupLocation || undefined,
      name: d.name.trim(),
      phone: d.phone,
      specialRequests: d.specialRequests || undefined,
    }));
    handleDetailSubmit(item._id, item.cartIndex, formattedDetails, useSameDetails);
    closeModal();
  };

  const totalPrice = (item?.price || 0) * (item?.quantity || 1);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003] p-4"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-auto p-6 max-h-[90vh] overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-havanaGray">
                {t('checkoutModal.detailsFor', { itemName: item.itemName || item.destination?.name || item.name || t('checkoutModal.unknownItem') })}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800"
                aria-label={t('checkoutModal.aria.closeDetailsModal')}
              >
                <BiX className="text-xl" />
              </button>
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {/* Tab navigation for multiple tickets */}
            {!useSameDetails && item.quantity > 1 && (
              <div className="flex space-x-2 mb-4 overflow-x-auto">
                {Array.from({ length: item.quantity }).map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveTab(index)}
                    className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === index
                        ? 'bg-havanaBlue text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {t('checkoutModal.ticket', { number: index + 1 })}
                    {isDetailComplete(details[index]) && (
                      <BiCheck className="ml-2 text-green-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
            {/* Price breakdown section */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-havanaGray">{t('checkoutModal.priceBreakdown')}</h4>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">{t('checkoutModal.pricePerTicket')}:</span>{' '}
                  {activeCurrency?.code || 'IDR'} {(item.price || 0).toLocaleString()}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">{t('checkoutModal.totalPrice')}:</span>{' '}
                  {activeCurrency?.code || 'IDR'} {totalPrice.toLocaleString()}
                </p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Animated content for each ticket tab */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div>
                  <label className="block text-sm font-medium text-havanaGray flex items-center">
                    <BiCalendar className="mr-2" /> {t('checkoutModal.bookingDate')}
                  </label>
                  <DatePicker
                    selected={details[activeTab]?.date || minDate}
                    onChange={handleDateChange}
                    minDate={minDate}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm"
                    dateFormat="MMMM d, yyyy"
                    required
                  />
                </div>
                {/* Pickup location is only for tours */}
                {item.modalType === 'tour' && (
                  <div>
                    <label className="block text-sm font-medium text-havanaGray flex items-center">
                      <BiMapPin className="mr-2" /> {t('checkoutModal.pickupLocation')}
                    </label>
                    <input
                      type="text"
                      name="pickupLocation"
                      value={details[activeTab]?.pickupLocation || ''}
                      onChange={handleInputChange}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm"
                      placeholder={t('checkoutModal.pickupLocationPlaceholder')}
                      required
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-havanaGray flex items-center">
                    <BiUser className="mr-2" /> {t('checkoutModal.guestName')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={details[activeTab]?.name || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm"
                    placeholder={t('checkoutModal.guestNamePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-havanaGray flex items-center">
                    <BiPhone className="mr-2" /> {t('checkoutModal.phone')}
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={details[activeTab]?.phone || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm"
                    placeholder={t('checkoutModal.phonePlaceholder')}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-havanaGray flex items-center">
                    <BiNote className="mr-2" /> {t('checkoutModal.specialRequests')}
                  </label>
                  <textarea
                    name="specialRequests"
                    value={details[activeTab]?.specialRequests || ''}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-havanaBlue focus:border-havanaBlue text-sm"
                    rows="3"
                    placeholder={t('checkoutModal.specialRequestsPlaceholder')}
                  />
                </div>
              </motion.div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-havanaPink text-white rounded-md text-sm font-semibold hover:bg-pink-700"
                >
                  {t('checkoutModal.cancel')}
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-havanaBlue text-white rounded-md text-sm font-semibold hover:bg-blue-700"
                  disabled={!allDetailsComplete}
                >
                  {t('checkoutModal.saveAllDetails')}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ItemDetailModal;