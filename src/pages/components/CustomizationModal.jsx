import React from 'react';
import { useTranslation } from 'react-i18next'; // <-- Tambahkan ini
import { motion, AnimatePresence } from 'framer-motion';
import { modalVariants, contentVariants, childVariants } from '../../components/partials/modalVariants';

function CustomizationModal({ isOpen, closeModal }) {
  const { t } = useTranslation(); // <-- Tambahkan ini

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[100]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full mx-4 md:mx-0 relative"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800 text-2xl font-semibold"
              title={t('modals.customization.closeButton')}
            >
              &times;
            </button>
            <motion.h3 className="text-2xl font-bold text-havanaGray mb-4" variants={childVariants}>
              {t('modals.customization.title')}
            </motion.h3>
            <motion.p className="text-gray-700 leading-relaxed" variants={childVariants}>
              {t('modals.customization.paragraph')}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CustomizationModal;