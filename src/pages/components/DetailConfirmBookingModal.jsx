import React from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { BiCheckCircle, BiReceipt } from 'react-icons/bi';
import { modalVariants, contentVariants } from '../../components/partials/modalVariants';

function DetailConfirmBookingModal({
  isOpen,
  closeModal,
  booking,
  modalType,
  activeCurrency,
  openTicketModal,
}) {
  console.log('🔍 DetailConfirmBookingModal render attempt:', { isOpen, booking });
  if (!isOpen || !booking) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const ticketLabel = {
    tour: 'Tour Tickets',
    activity: 'Activity Tickets',
    ticket: 'Tickets',
  }[modalType] || 'Tickets';

  const messageVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut', delay: 0.2 },
    },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10002]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-2 p-6 max-h-[90vh] overflow-y-auto"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-2 mb-4">
              <BiCheckCircle className="text-havanaBlue text-2xl" />
              <h3 className="text-xl font-bold text-havanaGray">Booking Confirmed</h3>
            </div>
            <motion.div
              className="bg-havanaBlue bg-opacity-10 border-l-4 border-havanaBlue p-4 mb-6 rounded-r-md"
              variants={messageVariants}
              initial="hidden"
              animate="visible"
            >
              <p className="text-havanaGray text-sm font-semibold">
                Your booking will be confirmed within 1 x 24 hours. After confirmation, you can proceed with payment. You can view your tickets in the Tickets section.
              </p>
            </motion.div>
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold text-havanaGray">Booking Details</h4>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Item:</span> {booking.itemName || 'N/A'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Type:</span>{' '}
                  {modalType.charAt(0).toUpperCase() + modalType.slice(1)}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Date:</span>{' '}
                  {booking.date ? formatDate(booking.date) : 'N/A'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Pickup Location:</span>{' '}
                  {booking.pickupLocation || 'N/A'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">{ticketLabel}:</span>{' '}
                  {booking.ticketCount || 'N/A'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Contact Phone:</span> {booking.phone || 'N/A'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Special Requests:</span>{' '}
                  {booking.specialRequests || 'None'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Price per Ticket:</span>{' '}
                  {booking.currency || activeCurrency?.code} {booking.price?.toLocaleString() || 'N/A'}
                </p>
                <p className="text-havanaGray text-sm">
                  <span className="font-medium">Total Price:</span>{' '}
                  {booking.currency || activeCurrency?.code} {booking.totalPrice?.toLocaleString() || 'N/A'}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="py-2 px-4 bg-havanaPink text-white rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  closeModal();
                  openTicketModal();
                }}
                className="py-2 px-4 bg-havanaBlue text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center"
              >
                <BiReceipt className="mr-2" />
                View Tickets
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default DetailConfirmBookingModal;