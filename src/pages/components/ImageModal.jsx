import React from "react";
import { AnimatePresence, motion } from 'framer-motion';
import { BiX } from 'react-icons/bi';

const modalVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

const imageModalVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.3 } },
};

function ImageModal({ isOpen, closeModal, selectedImage }) {
  if (!isOpen || !selectedImage) return null;

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10002]"
      variants={modalVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onClick={closeModal}
    >
      <motion.div
        className="bg-white rounded-lg shadow-lg max-w-3xl w-full mx-4 p-4 relative z-[10002]"
        variants={imageModalVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        onClick={(e) => e.stopPropagation()}
        onLoad={() => console.log('Image modal rendered, width:', window.innerWidth)}
      >
        <button
          onClick={closeModal}
          className="absolute top-2 right-2 text-white bg-havanaPink rounded-full p-1 hover:bg-pink-700 transition-colors"
        >
          <BiX className="text-xl" />
        </button>
        <img
          src={selectedImage}
          alt="Enlarged image"
          className="w-full h-[80vh] object-contain rounded-lg"
          onError={(e) => {
            console.error(`Image modal load error:`, selectedImage);
            e.target.src = 'https://via.placeholder.com/800x600?text=No+Image';
          }}
        />
      </motion.div>
    </motion.div>
  );
}

export default ImageModal;