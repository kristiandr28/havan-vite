import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // 👈 Import useTranslation

function ValidationModal({ isOpen, closeModal, onConfirm, isSubmitting }) {
  const { t } = useTranslation(); // 👈 Gunakan hook useTranslation

  const [agreed, setAgreed] = useState(false);

  // Varian animasi untuk modal
  const modalVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
  };

  // Varian animasi untuk konten
  const contentVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };

  // Pastikan modal hanya dirender jika isOpen adalah true
  if (!isOpen) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10005]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
        >
          <motion.div
            className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-2 p-6"
            variants={contentVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {t('validationModal.title')}
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              {t('validationModal.description')}
            </p>
            <div className="text-gray-600 text-sm mb-4">
              <h4 className="font-semibold">{t('validationModal.termsTitle')}</h4>
              <ul className="list-disc pl-5">
                <li>{t('validationModal.termsList.noRefund')}</li>
                <li>{t('validationModal.termsList.availability')}</li>
                <li>{t('validationModal.termsList.additionalFee')}</li>
                <li>{t('validationModal.termsList.cancellation')}</li>
              </ul>
            </div>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="terms"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="mr-2"
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                {t('validationModal.agreeCheckbox')}
              </label>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={closeModal}
                className="py-2 px-4 bg-red-500 text-white rounded-md text-sm font-semibold hover:bg-red-600"
                disabled={isSubmitting}
              >
                {t('validationModal.cancelButton')}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="py-2 px-4 bg-blue-500 text-white rounded-md text-sm font-semibold hover:bg-blue-600"
                disabled={isSubmitting || !agreed}
              >
                {isSubmitting ? t('validationModal.submittingButton') : t('validationModal.confirmButton')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ValidationModal;