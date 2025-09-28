import React from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { BiInfoCircle, BiX } from 'react-icons/bi';
import { modalVariants, contentVariants, childVariants } from './modalVariants';

function AboutModal({ isOpen, closeModal, about, error, BACKEND_URL }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
          key="modal-overlay"
        >
          <motion.div
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-4xl shadow-lg max-h-[80vh] overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            key="modal-content"
          >
            <motion.div
              className="flex justify-between items-center mb-4"
              variants={childVariants}
            >
              <div className="flex items-center space-x-2">
                <BiInfoCircle className="text-havanaBlue text-xl" />
                <h3 className="text-base sm:text-lg font-semibold text-havanaGray">About Us</h3>
              </div>
              <button onClick={closeModal} className="text-gray-600 hover:text-gray-800" aria-label="Close about modal">
                <BiX className="text-xl" />
              </button>
            </motion.div>
            {error && (
              <motion.p
                className="text-red-500 mb-4 text-[15px] sm:text-sm"
                variants={childVariants}
              >
                {error}
              </motion.p>
            )}
            {about ? (
              <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6"
                variants={childVariants}
              >
                <div className="space-y-4">
                  {about.image ? (
                    <motion.img
                      src={`${BACKEND_URL}${about.image}`}
                      alt={about.companyName}
                      className="w-full h-48 sm:h-64 object-cover rounded-lg"
                      onError={(e) => {
                        console.error(`About image load error: ${BACKEND_URL}${about.image}`);
                        e.target.src = 'https://via.placeholder.com/600x300?text=No+Image';
                      }}
                      variants={childVariants}
                    />
                  ) : (
                    <motion.div
                      className="w-full h-48 sm:h-64 bg-gray-200 flex items-center justify-center rounded-lg"
                      variants={childVariants}
                    >
                      <span className="text-gray-500 text-sm">No Image</span>
                    </motion.div>
                  )}
                  <motion.div variants={childVariants}>
                    <h4 className="text-[15px] sm:text-sm font-medium text-gray-700">Company Name</h4>
                    <p className="text-[15px] sm:text-sm text-gray-900">{about.companyName}</p>
                  </motion.div>
                  <motion.div variants={childVariants}>
                    <h4 className="text-[15px] sm:text-sm font-medium text-gray-700">Description</h4>
                    <p className="text-[15px] sm:text-sm text-gray-900">{about.description}</p>
                  </motion.div>
                </div>
                <div className="space-y-4">
                  <motion.div variants={childVariants}>
                    <h4 className="text-[15px] sm:text-sm font-medium text-gray-700">Mission</h4>
                    <p className="text-[15px] sm:text-sm text-gray-900">{about.mission || '-'}</p>
                  </motion.div>
                  <motion.div variants={childVariants}>
                    <h4 className="text-[15px] sm:text-sm font-medium text-gray-700">Vision</h4>
                    <p className="text-[15px] sm:text-sm text-gray-900">{about.vision || '-'}</p>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.p
                className="text-[15px] sm:text-sm text-gray-600"
                variants={childVariants}
              >
                {error || 'Loading...'}
              </motion.p>
            )}
            <motion.div
              className="mt-6 flex justify-end"
              variants={childVariants}
            >
              <button
                onClick={closeModal}
                className="py-2 px-4 bg-havanaPink text-white rounded-md hover:bg-pink-700 transition-colors duration-200 text-[15px] sm:text-sm"
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default AboutModal;