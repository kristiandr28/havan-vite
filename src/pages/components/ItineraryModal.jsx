import React from "react";
import { AnimatePresence, motion } from 'framer-motion';
import { BiX } from 'react-icons/bi';

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

function ItineraryModal({ isOpen, closeModal, selectedItem }) {
  if (!isOpen || !selectedItem) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]"
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={closeModal}
    >
      <motion.div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl sm:max-w-lg mx-2 p-6 sm:p-4 max-h-[80vh] overflow-y-auto"
        style={{ backgroundColor: '#ffffff !important' }}
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        onLoad={() => console.log('Itinerary modal rendered, width:', window.innerWidth)}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl sm:text-xl font-bold text-havanaGray">Itinerary for {selectedItem.name}</h3>
          <button onClick={closeModal} className="text-gray-600 hover:text-gray-800" aria-label="Close itinerary modal">
            <BiX className="text-xl" />
          </button>
        </div>
        <div className="space-y-4">
          {selectedItem.itinerary?.length > 0 ? (
            selectedItem.itinerary.map((item, index) => (
              <div key={index} className="border-l-4 border-havanaBlue pl-4">
                <h5 className="text-havanaGray font-medium text-sm">{item.title}</h5>
                <p className="text-havanaGray text-sm">{item.description}</p>
              </div>
            ))
          ) : (
            <p className="text-havanaGray text-sm">No itinerary available</p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={closeModal}
            className="py-2 px-4 bg-havanaPink text-white rounded-md hover:bg-pink-700 transition-colors text-sm"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ItineraryModal;