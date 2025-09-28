import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiX, BiChevronDown, BiChevronUp, BiLoaderAlt, BiCheckCircle } from 'react-icons/bi';
import axios from 'axios';
import { useTranslation } from 'react-i18next'; // Import useTranslation
import { modalVariants, contentVariants } from './modalVariants';
import ItemDetailModal from './ItemDetailModal';
import ValidationModal from '../../pages/components/ValidationModal';

const BACKEND_URL = import.meta.env.VITE_API_URL;

function CheckoutModal({
  isOpen,
  closeModal,
  cartItems,
  activeCurrency,
  isAuthenticated,
  handleLogin,
  itemDetails,
  setItemDetails,
  token,
  currentUser,
}) {
  const { t } = useTranslation(); // Initialize useTranslation hook
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [isItemDetailModalOpen, setIsItemDetailModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [useSameDetails, setUseSameDetails] = useState(true);
  const [error, setError] = useState('');
  const [expandedItemIndex, setExpandedItemIndex] = useState(null);
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [isBookingConfirmedModalOpen, setIsBookingConfirmedModalOpen] = useState(false);

  // --- Callbacks ---
  const fetchUserData = useCallback(async () => {
    if (!token) {
      console.warn('CheckoutModal: Cannot fetch user data, token is missing.');
      setError(t('checkoutModal.errors.tokenMissing'));
      handleLogin();
      closeModal();
      return;
    }

    setIsLoadingUser(true);
    setError('');
    try {
      const response = await axios.get(`${BACKEND_URL}/api/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('CheckoutModal: Successfully fetched user data (fallback):', response.data);
    } catch (err) {
      console.error('CheckoutModal: Failed to fetch user data (fallback):', err);
      if (err.response && (err.response.status === 401 || err.response.status === 403)) {
        setError(t('checkoutModal.errors.sessionExpired'));
        handleLogin();
        closeModal();
      } else {
        setError(t('checkoutModal.errors.userDataFailed'));
      }
    } finally {
      setIsLoadingUser(false);
    }
  }, [token, handleLogin, closeModal, t]);

  const allDetailsFilled = useCallback(() => {
    return cartItems.every((item, index) => {
      const details = itemDetails.find((d) => d.itemId === item._id && d.cartIndex === index);
      const isFilled = details && details.details.length >= (item.quantity || 1);
      return isFilled;
    });
  }, [cartItems, itemDetails]);

  // --- Effects ---
  useEffect(() => {
    console.log('CheckoutModal State Check on useEffect:', {
      isOpen,
      isAuthenticated,
      currentUser,
      tokenExists: !!token,
      currentStep: checkoutStep,
    });

    if (!isOpen) {
      setCheckoutStep(1);
      setError('');
      setExpandedItemIndex(null);
      setIsSubmitting(false);
      setIsLoadingUser(false);
      setIsBookingConfirmedModalOpen(false);
      return;
    }

    if (isOpen && !isAuthenticated) {
      console.log('CheckoutModal: Modal opened but user is NOT authenticated. Redirecting to login.');
      setError(t('checkoutModal.errors.mustLogin'));
      handleLogin();
      closeModal();
      return;
    }

    if (isOpen && isAuthenticated) {
      if (!currentUser || !currentUser.id || !token) {
        console.error('CheckoutModal: Authentication issue. currentUser or token missing.');
        setError(t('checkoutModal.errors.authIncomplete'));
        handleLogin();
        closeModal();
        return;
      }
      setCheckoutStep(2);
    }
  }, [isOpen, isAuthenticated, currentUser, token, handleLogin, closeModal, t]);

  useEffect(() => {
    if (isOpen) {
      const storedItemDetails = localStorage.getItem('itemDetails');
      if (storedItemDetails) {
        try {
          const parsedDetails = JSON.parse(storedItemDetails);
          const relevantDetails = parsedDetails.filter((detail) =>
            cartItems.some((cartItem, idx) => cartItem._id === detail.itemId && idx === detail.cartIndex)
          );
          setItemDetails(relevantDetails);
          console.log('CheckoutModal: Loaded itemDetails from localStorage.');
        } catch (e) {
          console.error('CheckoutModal: Failed to parse itemDetails from localStorage:', e);
          localStorage.removeItem('itemDetails');
        }
      }
    }
  }, [isOpen, cartItems, setItemDetails]);

  // --- Helper Functions ---
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price || 0) * (item.quantity || 1), 0);
  };

  const openItemDetailModal = (item, index) => {
    if (!item._id) {
      console.error('CheckoutModal: Invalid item, missing _id:', item);
      setError(t('checkoutModal.errors.invalidItem'));
      return;
    }
    console.log('CheckoutModal: Opening ItemDetailModal for item:', { ...item, cartIndex: index });
    setSelectedItem({ ...item, cartIndex: index });
    setIsItemDetailModalOpen(true);
  };

  const closeItemDetailModal = () => {
    console.log('CheckoutModal: Closing ItemDetailModal');
    setIsItemDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleDetailSubmit = (itemId, cartIndex, details, applyToAll) => {
    console.log('CheckoutModal: Detail submitted:', { itemId, cartIndex, details, applyToAll });
    setItemDetails((prev) => {
      const cartItem = cartItems.find((item, idx) => item._id === itemId && idx === cartIndex);
      if (!cartItem) {
        console.error('CheckoutModal: Cart item not found for submitted details:', itemId, cartIndex);
        return prev;
      }
      if (!Array.isArray(details)) {
        console.error('CheckoutModal: Details is not an array:', details);
        return prev;
      }

      const updatedDetailsForThisItem = applyToAll && details.length > 0
        ? Array(cartItem.quantity).fill(details[0])
        : details.slice(0, cartItem.quantity);

      const newItemDetails = [
        ...prev.filter((d) => !(d.itemId === itemId && d.cartIndex === cartIndex)),
        { itemId, cartIndex, details: updatedDetailsForThisItem },
      ];

      localStorage.setItem('itemDetails', JSON.stringify(newItemDetails));
      console.log('CheckoutModal: Updated itemDetails and stored in localStorage.');
      return newItemDetails;
    });
    closeItemDetailModal();
  };

  const nextStep = () => {
    if (checkoutStep === 2) {
      if (!allDetailsFilled()) {
        setError(t('checkoutModal.errors.completeDetails'));
        return;
      }
      setError('');
      setCheckoutStep(3);
    }
  };

  const prevStep = () => {
    if (checkoutStep > 2) {
      setCheckoutStep(checkoutStep - 1);
      setError('');
      setExpandedItemIndex(null);
    }
  };

  const submitCheckout = () => {
    if (!allDetailsFilled()) {
      setError(t('checkoutModal.errors.completeDetails'));
      return;
    }
    setError('');
    console.log('CheckoutModal: Opening ValidationModal for booking submission.');
    setIsValidationModalOpen(true);
  };

  const handleValidationConfirm = async () => {
    const userToUse = currentUser;
    const userId = userToUse?.id || userToUse?._id;

    console.log('CheckoutModal: handleValidationConfirm called. Using User:', userToUse, 'UserID:', userId, 'Token exists:', !!token);

    if (!userToUse || !userId || !token) {
      console.error('CheckoutModal: Missing crucial data (user/ID/token) for booking submission.');
      setError(t('checkoutModal.errors.authProblem'));
      setIsValidationModalOpen(false);
      handleLogin();
      closeModal();
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const items = itemDetails.map((detail) => {
        const cartItem = cartItems.find((item, idx) => item._id === detail.itemId && idx === detail.cartIndex);
        if (!cartItem) {
          console.warn('CheckoutModal: Cart item not found for detail, skipping:', detail);
          return null;
        }

        const capitalizedItemType = cartItem.modalType
          ? cartItem.modalType.charAt(0).toUpperCase() + cartItem.modalType.slice(1)
          : null;

        if (!capitalizedItemType) {
          console.error('CheckoutModal: Failed to determine itemType for cart item:', cartItem);
          return null;
        }

        return {
          itemId: detail.itemId,
          itemType: capitalizedItemType,
          quantity: cartItem.quantity || 1,
          price: cartItem.price || 0,
          details: detail.details.map((d) => ({
            name: d.name,
            date: d.date ? new Date(d.date).toISOString() : undefined,
            pickupLocation: d.pickupLocation,
            phone: d.phone,
            specialRequests: d.specialRequests || '',
          })),
        };
      }).filter(Boolean);

      if (items.length === 0) {
        setError(t('checkoutModal.errors.noValidItems'));
        setIsSubmitting(false);
        setIsValidationModalOpen(false);
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          items,
          currency: activeCurrency.code,
          totalAmount: calculateTotal(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        let errorMessage = result.message || t('errors.bookingFailed');
        if (response.status === 400 && result.errors) {
          errorMessage += ': ' + result.errors.map((e) => e.message || e.msg).join(', ');
        } else if (response.status === 401 || response.status === 403) {
          errorMessage = t('checkoutModal.errors.authFailed');
          handleLogin();
          closeModal();
          return;
        }
        throw new Error(errorMessage);
      }

      console.log('CheckoutModal: Booking created successfully:', result);
      setItemDetails([]);
      localStorage.removeItem('itemDetails');
      setIsValidationModalOpen(false);
      setIsBookingConfirmedModalOpen(true);
    } catch (err) {
      console.error('CheckoutModal: Booking creation error:', err);
      setError(err.message || t('checkoutModal.errors.bookingFailed'));
      setIsValidationModalOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeBookingConfirmedModal = () => {
    setIsBookingConfirmedModalOpen(false);
    closeModal();
  };

  const closeValidationModal = () => {
    setIsValidationModalOpen(false);
  };

  const toggleItemDetails = (index) => {
    setExpandedItemIndex(expandedItemIndex === index ? null : index);
  };

  const steps = [t('checkoutModal.steps.itemDetails'), t('checkoutModal.steps.summary')];
  const totalSteps = steps.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10002] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
          key="checkout-modal-overlay"
        >
          <motion.div
            className="max-h-[80vh] w-full max-w-[90vw] overflow-y-auto rounded-xl bg-white p-4 shadow-lg sm:max-w-xl sm:p-6"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            key="checkout-modal-content"
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-base font-semibold text-havanaGray sm:text-lg">{t('checkoutModal.title')}</h3>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800"
                aria-label={t('checkoutModal.aria.closeCheckoutModal')}
              >
                <BiX className="text-xl" />
              </button>
            </div>

            <div className="mb-6">
              <div className="mb-2 flex justify-between">
                {steps.map((label, index) => (
                  <div
                    key={index}
                    className={`text-sm font-medium ${checkoutStep >= index + 2 ? 'text-havanaBlue' : 'text-gray-400'}`}
                  >
                    {label}
                  </div>
                ))}
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className="h-2 rounded-full bg-havanaBlue transition-all duration-300"
                  style={{ width: `${((checkoutStep - 1) / totalSteps) * 100}%` }}
                />
              </div>
            </div>

            <div className="space-y-4">
              {checkoutStep === 1 && (
                <div className="text-center py-8">
                  <p className="text-gray-700 font-medium mb-4">{t('checkoutModal.verifyingAuth')}</p>
                  <BiLoaderAlt className="animate-spin text-havanaBlue text-4xl mx-auto" />
                  {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                  <p className="mt-4 text-gray-500 text-sm">{t('checkoutModal.verifyingAuthNote')}</p>
                </div>
              )}

              {checkoutStep === 2 && (
                <div>
                  <h4 className="mb-3 text-sm font-medium text-gray-700">{t('checkoutModal.itemDetails')}</h4>
                  <div className="mb-3">
                    <label className="flex items-center text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={useSameDetails}
                        onChange={() => setUseSameDetails(!useSameDetails)}
                        className="mr-2"
                      />
                      {t('checkoutModal.useSameDetails')}
                    </label>
                  </div>
                  {cartItems.length === 0 ? (
                    <p className="text-sm text-gray-600">{t('checkoutModal.emptyCart')}</p>
                  ) : (
                    <ul className="space-y-3">
                      {cartItems.map((item, index) => {
                        const details = itemDetails.find(
                          (d) => d.itemId === item._id && d.cartIndex === index
                        );
                        const filledCount = details ? details.details.length : 0;
                        return (
                          <li
                            key={`${item._id}-${index}`}
                            className="flex items-center justify-between border-b border-gray-200 py-2"
                          >
                            <div className="flex-1">
                              <h5 className="text-sm font-medium text-gray-700">
                                {item.destination?.name || item.name || t('checkoutModal.unknownItem')}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {activeCurrency.code} {(item.price || 0).toLocaleString()} x {item.quantity || 1}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t('checkoutModal.detailsFilled', { filled: filledCount, total: item.quantity || 1 })}
                              </p>
                              {filledCount >= (item.quantity || 1) && (
                                <p className="text-xs text-green-600">{t('checkoutModal.allDetailsFilled')}</p>
                              )}
                            </div>
                            <button
                              onClick={() => openItemDetailModal(item, index)}
                              className="rounded-md bg-havanaBlue px-3 py-1 text-sm text-white transition-colors duration-200 hover:bg-blue-700"
                              disabled={!item._id}
                            >
                              {filledCount >= (item.quantity || 1) ? t('checkoutModal.editDetails') : t('checkoutModal.addDetails')}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}

              {checkoutStep === 3 && (
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-havanaGray">{t('checkoutModal.checkoutSummary')}</h4>
                  <div className="space-y-3">
                    {cartItems.map((item, index) => {
                      const details = itemDetails.find(
                        (d) => d.itemId === item._id && d.cartIndex === index
                      );
                      const isExpanded = expandedItemIndex === index;
                      return (
                        <motion.div
                          key={`${item._id}-summary-${index}`}
                          className="cursor-pointer rounded-lg bg-gray-50 p-3 shadow-sm transition-shadow duration-200 hover:shadow-md"
                          onClick={() => toggleItemDetails(index)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-700">
                                {item.destination?.name || item.name || t('checkoutModal.unknownItem')}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t('checkoutModal.type')}: {item.modalType || 'N/A'} | {t('checkoutModal.quantity')}: {item.quantity || 1}
                              </p>
                              <p className="text-xs text-gray-500">
                                {t('checkoutModal.price')}: {activeCurrency.code} {((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                              </p>
                            </div>
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              {isExpanded ? <BiChevronUp className="text-lg" /> : <BiChevronDown className="text-lg" />}
                            </motion.div>
                          </div>
                          <AnimatePresence>
                            {isExpanded && details && Array.isArray(details.details) && details.details.length > 0 && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="mt-2 border-t border-gray-200 pt-2"
                              >
                                {details.details.map((detail, dIndex) => (
                                  <div key={dIndex} className="space-y-1 text-xs text-gray-600">
                                    <p>
                                      <span className="font-medium">{t('checkoutModal.detail', { number: dIndex + 1 })}:</span>
                                    </p>
                                    <p>
                                      <span className="font-medium">{t('checkoutModal.guestName')}:</span> {detail.name || t('checkoutModal.notSpecified')}
                                    </p>
                                    <p>
                                      {t('checkoutModal.date')}: {detail.date ? new Date(detail.date).toLocaleDateString('en-US') : t('notSpecified')}
                                    </p>
                                    {detail.pickupLocation && <p>{t('checkoutModal.pickupLocation')}: {detail.pickupLocation}</p>}
                                    <p>{t('checkoutModal.phone')}: {detail.phone || t('checkoutModal.notSpecified')}</p>
                                    <p>{t('checkoutModal.specialRequests')}: {detail.specialRequests || t('checkoutModal.none')}</p>
                                  </div>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                          {(!details || !Array.isArray(details.details) || details.details.length === 0) && isExpanded && (
                            <p className="mt-2 text-xs text-gray-500">{t('checkoutModal.noDetailsFilled')}</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                  <motion.div
                    className="sticky bottom-0 mt-4 border-t border-gray-200 bg-white pt-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex items-center justify-between text-base font-semibold sm:text-lg">
                      <span>{t('checkoutModal.total')}:</span>
                      <span>{activeCurrency.code} {calculateTotal().toLocaleString()}</span>
                    </div>
                  </motion.div>
                </div>
              )}
            </div>

            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

            <div className="mt-6 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                className={`h-10 rounded-md px-4 sm:text-sm ${
                  checkoutStep === 1 || checkoutStep === 2 ? 'cursor-not-allowed bg-gray-300 text-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={checkoutStep === 1 || checkoutStep === 2}
              >
                {t('checkoutModal.back')}
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="h-10 rounded-md bg-gray-200 px-4 text-gray-700 hover:bg-gray-300 sm:text-sm"
                >
                  {t('checkoutModal.cancel')}
                </button>
                {checkoutStep === 2 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="h-10 rounded-md bg-havanaBlue px-4 text-white hover:bg-blue-700 sm:text-sm"
                  >
                    {t('checkoutModal.next')}
                  </button>
                ) : checkoutStep === 3 ? (
                  <button
                    type="button"
                    onClick={submitCheckout}
                    className="h-10 rounded-md bg-havanaBlue px-4 text-white hover:bg-blue-700 sm:text-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? t('checkoutModal.processing') : t('checkoutModal.completeCheckout')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {}}
                    className="h-10 rounded-md bg-gray-300 px-4 text-gray-500 cursor-not-allowed sm:text-sm"
                    disabled
                  >
                    {t('checkoutModal.loading')}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
      {isItemDetailModalOpen && (
        <ItemDetailModal
          isOpen={isItemDetailModalOpen}
          closeModal={closeItemDetailModal}
          item={selectedItem}
          activeCurrency={activeCurrency}
          handleDetailSubmit={handleDetailSubmit}
          useSameDetails={useSameDetails}
          initialDetails={
            selectedItem ? itemDetails.find((d) => d.itemId === selectedItem._id && d.cartIndex === selectedItem.cartIndex)?.details : []
          }
        />
      )}
      {isValidationModalOpen && (
        <ValidationModal
          isOpen={isValidationModalOpen}
          closeModal={closeValidationModal}
          onConfirm={handleValidationConfirm}
          isSubmitting={isSubmitting}
          errorMessage={error}
        />
      )}
      {isBookingConfirmedModalOpen && (
        <motion.div
          className="fixed inset-0 z-[10003] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeBookingConfirmedModal}
          key="booking-confirmed-modal-overlay"
        >
          <motion.div
            className="w-full max-w-[90vw] rounded-xl bg-white p-6 shadow-xl sm:max-w-md"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            key="booking-confirmed-modal-content"
          >
            <div className="relative bg-gradient-to-r from-havanaBlue to-blue-700 rounded-t-xl -mx-6 -mt-6 p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="flex justify-center mb-4"
              >
                <BiCheckCircle className="text-white text-5xl" />
              </motion.div>
              <h3 className="text-lg font-semibold text-white text-center">{t('checkoutModal.bookingConfirmed')}</h3>
              <button
                onClick={closeBookingConfirmedModal}
                className="absolute top-4 right-4 text-white hover:text-gray-200"
                aria-label={t('checkoutModal.aria.closeBookingConfirmedModal')}
              >
                <BiX className="text-2xl" />
              </button>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-700 leading-relaxed text-center">{t('checkoutModal.bookingConfirmedMessage')}</p>
            </div>
            <div className="mt-6 flex justify-center">
              <motion.button
                type="button"
                onClick={closeBookingConfirmedModal}
                className="h-10 rounded-md bg-havanaBlue px-6 text-white font-medium text-sm shadow-md hover:bg-blue-700 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {t('checkoutModal.ok')}
              </motion.button> {/* Corrected closing tag */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CheckoutModal;