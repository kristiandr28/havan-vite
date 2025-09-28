import { BiX } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import React from "react";

// Modal variants now directly in the file
const modalVariants = {
  hidden: { y: "-100vh", opacity: 0 },
  visible: { y: "0", opacity: 1, transition: { type: "spring", stiffness: 100, damping: 20 } },
  exit: { y: "100vh", opacity: 0 }
};

function DeleteConfirmationModal({ ticketToDelete, closeModal, handleDelete }) {
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white rounded-lg p-6 w-full max-w-sm shadow-xl text-center"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <button
            onClick={closeModal}
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close confirmation modal"
          >
            <BiX className="text-2xl" />
          </button>
          <h3 className="text-xl font-semibold text-red-600 mb-4">Konfirmasi Hapus</h3>
          <p className="text-gray-700 mb-6">
            Apakah Anda yakin ingin menghapus tiket ke{' '}
            <strong>{ticketToDelete?.destination?.name || 'Unknown Destination'}</strong>?
            Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={closeModal}
              className="py-2 px-4 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
            >
              Batal
            </button>
            <button
              onClick={handleDelete}
              className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
            >
              Hapus
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default DeleteConfirmationModal;