import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Define the animation variants for the modal and its content
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

const stepVariants = {
  initial: { opacity: 0, x: 50 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};

/**
 * A modal component for the initial booking steps, allowing users to select
 * a service type and a specific service before proceeding to the details.
 * It also handles the number of tickets.
 * @param {object} props The component props.
 * @param {boolean} props.isOpen - Whether the modal is open.
 * @param {Function} props.closeModal - Function to close the modal.
 * @param {number} props.bookingStep - The current step of the booking process.
 * @param {Function} props.setBookingStep - Function to update the booking step.
 * @param {string} props.selectedServiceType - The selected service type ('tour', 'activity', 'ticket').
 * @param {Function} props.setSelectedServiceType - Function to set the service type.
 * @param {string} props.selectedService - The ID of the selected service.
 * @param {Function} props.setSelectedService - Function to set the selected service ID.
 * @param {Array<object>} props.tours - List of available tours.
 * @param {Array<object>} props.activities - List of available activities.
 * @param {Array<object>} props.tickets - List of available tickets.
 * @param {string} props.error - Any error message to display.
 * @param {Function} props.handleBookingSubmit - Function to handle the final submission.
 * @param {Function} props.handleSeeDetail - Function to open the details modal.
 * @param {Function} props.nextStep - Function to advance to the next step.
 * @param {Function} props.prevStep - Function to go back a step.
 * @param {Function} props.openCheckoutModal - Function to open the checkout modal.
 * @param {Function} props.setCartItems - Function to update the cart items state.
 * @param {object} props.activeCurrency - The currently active currency.
 * @param {string} props.name - The name of the service to be booked.
 */
function BookingModal({
  isOpen,
  closeModal,
  bookingStep,
  setBookingStep,
  selectedServiceType,
  setSelectedServiceType,
  selectedService,
  setSelectedService,
  tours = [],
  activities = [],
  tickets = [],
  error,
  handleBookingSubmit,
  handleSeeDetail,
  nextStep,
  prevStep,
  openCheckoutModal,
  setCartItems,
  activeCurrency,
  name,
}) {
  const maxTickets = 5;
  const ticketOptions = [1, 2, 3, 4, 5];
  const [ticketCount, setTicketCount] = useState(1);
  const [customerName, setCustomerName] = useState(''); // New state for customer name input

  if (!isOpen) return null;

  /**
   * Finds the selected service item from the provided lists.
   * @returns {object | null} The selected item object or null.
   */
  const getSelectedItem = () => {
    if (selectedServiceType === 'tour') {
      return tours.find((t) => t._id === selectedService);
    } else if (selectedServiceType === 'activity') {
      return activities.find((a) => a._id === selectedService);
    } else if (selectedServiceType === 'ticket') {
      return tickets.find((t) => t._id === selectedService);
    }
    return null;
  };

  const selectedItem = getSelectedItem();
  const totalPrice = selectedItem?.price ? selectedItem.price * ticketCount : 0;

  /**
   * Handles the form submission by preparing the item data and
   * proceeding to the next step (checkout).
   */
  const handleSubmit = () => {
    if (!selectedServiceType || !selectedService) {
      handleBookingSubmit({ error: 'Please complete all selections.' });
      return;
    }

    const item = {
      _id: selectedService,
      name: name || selectedItem?.name || selectedItem?.destination?.name || 'Unknown Item',
      customerName: customerName, // Add customerName to the item
      destination: selectedServiceType === 'ticket' ? { name: selectedItem?.destination?.name } : undefined,
      price: selectedItem?.price || 0,
      quantity: ticketCount,
      modalType: selectedServiceType,
      ticketType: selectedServiceType === 'ticket' ? selectedItem?.ticketType : undefined,
    };

    console.log('BookingModal: Proceeding to checkout with item:', item);

    // Update cartItems state
    if (typeof setCartItems === 'function') {
      setCartItems([item]);
    } else {
      console.error('BookingModal: setCartItems is not a function:', setCartItems);
    }

    // Open CheckoutModal
    if (typeof openCheckoutModal === 'function') {
      openCheckoutModal();
    } else {
      console.error('BookingModal: openCheckoutModal is not a function:', openCheckoutModal);
    }

    handleBookingSubmit({ success: true });
    closeModal();
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10001]"
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={closeModal}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-2 p-6 sm:p-8 max-h-[80vh] overflow-y-auto"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl sm:text-xl font-bold text-havanaGray">Book Your Adventure</h3>
          <button
            onClick={closeModal}
            className="text-gray-600 hover:text-gray-800"
            aria-label="Close booking modal"
          >
            {/* Replaced BiX with an inline SVG to fix the build error */}
            <svg xmlns="http://www.w3.org/2000/svg" className="text-xl" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {['Service Type', 'Service & Confirm'].map((label, index) => (
              <div
                key={index}
                className={`text-sm font-medium ${bookingStep >= index + 1 ? 'text-havanaBlue' : 'text-gray-400'}`}
              >
                {label}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-havanaBlue h-2 rounded-full transition-all duration-300"
              style={{ width: `${(bookingStep / 2) * 100}%` }}
            />
          </div>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={bookingStep}
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            {bookingStep === 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <div className="relative">
                  <select
                    name="serviceType" // Added name attribute
                    value={selectedServiceType}
                    onChange={(e) => {
                      setSelectedServiceType(e.target.value);
                      setSelectedService('');
                    }}
                    className="appearance-none block w-full h-12 px-4 bg-gray-100 text-gray-800 rounded-lg focus:ring-2 focus:ring-havanaPink focus:outline-none transition-all duration-200 hover:bg-gray-200 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select Service Type</option>
                    <option value="tour">Tour</option>
                    <option value="activity">Activity</option>
                    <option value="ticket">Ticket</option>
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
              </div>
            )}
            {bookingStep === 2 && (
              <div>
                {/* New input field for customer name */}
                <div className="mb-4">
                  <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    id="customerName"
                    name="customerName"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="block w-full h-12 px-4 bg-gray-100 text-gray-800 rounded-lg focus:ring-2 focus:ring-havanaPink focus:outline-none transition-all duration-200 hover:bg-gray-200 sm:text-sm"
                    placeholder="Enter your name"
                    required
                  />
                </div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedServiceType === 'tour'
                    ? 'Select Tour'
                    : selectedServiceType === 'activity'
                    ? 'Select Activity'
                    : 'Select Ticket'}
                </label>
                <div className="relative">
                  <select
                    name="serviceId" // Added name attribute
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="appearance-none block w-full h-12 px-4 bg-gray-100 text-gray-800 rounded-lg focus:ring-2 focus:ring-havanaPink focus:outline-none transition-all duration-200 hover:bg-gray-200 sm:text-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
                    required
                  >
                    <option value="">Select an option</option>
                    {selectedServiceType === 'tour' &&
                      tours.map((tour) => (
                        <option key={tour._id} value={tour._id}>
                          {tour.name}
                        </option>
                      ))}
                    {selectedServiceType === 'activity' &&
                      activities.map((activity) => (
                        <option key={activity._id} value={activity._id}>
                          {activity.name}
                        </option>
                      ))}
                    {selectedServiceType === 'ticket' &&
                      tickets.map((ticket) => (
                        <option key={ticket._id} value={ticket._id}>
                          {ticket.destination?.name} ({ticket.ticketType.join(', ')})
                        </option>
                      ))}
                  </select>
                  <svg
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 pointer-events-none"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </div>
                {selectedServiceType && selectedService && (
                  <div className="mt-4 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleSeeDetail(selectedItem, selectedServiceType)}
                      className="h-10 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 sm:text-sm font-semibold"
                    >
                      See Detail
                    </button>
                  </div>
                )}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Tickets</label>
                  <div className="flex space-x-2 mb-4">
                    {ticketOptions.map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setTicketCount(count)}
                        className={`py-2 px-4 rounded-md text-sm font-semibold border ${
                          ticketCount === count
                            ? 'bg-havanaBlue text-white border-havanaBlue'
                            : 'bg-white text-havanaGray border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                  <p className="text-havanaGray text-xs">Max {maxTickets} tickets</p>
                </div>
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-havanaGray mb-2">Booking Summary</h4>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Service Type:</span> {selectedServiceType}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Service:</span>{' '}
                    {selectedItem?.name || selectedItem?.destination?.name || 'Not specified'}
                  </p>
                  {selectedServiceType === 'ticket' && (
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Ticket Type:</span>{' '}
                      {selectedItem?.ticketType?.join(', ') || 'N/A'}
                    </p>
                  )}
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Quantity:</span> {ticketCount}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Price per Ticket:</span>{' '}
                    {activeCurrency?.code || 'IDR'} {selectedItem?.price?.toLocaleString() || 'N/A'}
                  </p>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Total Price:</span>{' '}
                    {activeCurrency?.code || 'IDR'} {totalPrice.toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          </motion.div>
        </AnimatePresence>
        <div className="flex justify-between mt-6">
          <button
            type="button"
            onClick={prevStep}
            className={`h-10 px-4 rounded-md sm:text-sm ${
              bookingStep === 1 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            disabled={bookingStep === 1}
          >
            Back
          </button>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={closeModal}
              className="h-10 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 sm:text-sm"
            >
              Cancel
            </button>
            {bookingStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="h-10 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 sm:text-sm"
                disabled={!selectedServiceType}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                className="h-10 px-4 bg-havanaBlue text-white rounded-md hover:bg-blue-700 sm:text-sm"
                disabled={!selectedServiceType || !selectedService}
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default BookingModal;
