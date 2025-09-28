import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { BiX, BiPhone, BiEnvelope, BiHomeAlt, BiLogoWhatsapp, BiLogoInstagram, BiLogoTwitter, BiLogoFacebook } from 'react-icons/bi';
import { modalVariants } from './modalVariants';

function ContactModal({ isOpen, closeModal, contact, error }) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-lg p-6 bg-white rounded-lg shadow-xl"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
              aria-label={t('contactModal.ariaLabels.close')}
            >
              <BiX className="text-2xl" />
            </button>

            <h2 className="text-2xl font-bold text-havanaBlue mb-4 border-b pb-2">
              {t('contactModal.title')}
            </h2>

            {/* Loading/Error/No Data States */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                <strong className="font-bold">{t('contactModal.errorTitle')}</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            {!contact && !error && (
              <div className="text-gray-600 text-center py-8">
                <p>{t('contactModal.loading')}</p>
              </div>
            )}

            {contact && (
              <div className="space-y-4">
                {/* Phone */}
                {contact.phone && (
                  <div className="flex items-center text-gray-700">
                    <BiPhone className="mr-3 text-havanaBlue text-xl" />
                    <a href={`tel:${contact.phone}`} className="hover:underline">
                      {contact.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {contact.email && (
                  <div className="flex items-center text-gray-700">
                    <BiEnvelope className="mr-3 text-havanaBlue text-xl" />
                    <a href={`mailto:${contact.email}`} className="hover:underline">
                      {contact.email}
                    </a>
                  </div>
                )}

                {/* WhatsApp */}
                {contact.whatsapp && (
                  <div className="flex items-center text-gray-700">
                    <BiLogoWhatsapp className="mr-3 text-havanaBlue text-xl" />
                    <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {contact.whatsapp}
                    </a>
                  </div>
                )}

                {/* Address */}
                {contact.address && (
                  <div className="flex items-start text-gray-700">
                    <BiHomeAlt className="mr-3 text-havanaBlue text-xl mt-1 flex-shrink-0" />
                    <p>{contact.address}</p>
                  </div>
                )}

                {/* Social Media with Tooltips */}
                {contact.socialMedia && (Object.values(contact.socialMedia).some(link => link)) && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold text-havanaBlue mb-4 text-center">
                      {t('contactModal.socialMediaTitle')}
                    </h3>
                    <div className="flex justify-center space-x-6">
                      {/* Instagram with Tooltip */}
                      {contact.socialMedia.instagram && (
                        <div className="relative group">
                          <motion.a
                            href={contact.socialMedia.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-havanaPink transition-all duration-300 transform hover:scale-125"
                            whileHover={{ scale: 1.25, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={t('contactModal.ariaLabels.instagram')}
                          >
                            <BiLogoInstagram className="text-4xl" />
                          </motion.a>
                          <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
                            {t('contactModal.tooltip.instagram')}
                          </span>
                        </div>
                      )}

                      {/* Twitter with Tooltip */}
                      {contact.socialMedia.twitter && (
                        <div className="relative group">
                          <motion.a
                            href={contact.socialMedia.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-havanaBlue transition-all duration-300 transform hover:scale-125"
                            whileHover={{ scale: 1.25, rotate: -5 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={t('contactModal.ariaLabels.twitter')}
                          >
                            <BiLogoTwitter className="text-4xl" />
                          </motion.a>
                          <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
                            {t('contactModal.tooltip.twitter')}
                          </span>
                        </div>
                      )}

                      {/* Facebook with Tooltip */}
                      {contact.socialMedia.facebook && (
                        <div className="relative group">
                          <motion.a
                            href={contact.socialMedia.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-blue-700 transition-all duration-300 transform hover:scale-125"
                            whileHover={{ scale: 1.25, rotate: 5 }}
                            whileTap={{ scale: 0.9 }}
                            aria-label={t('contactModal.ariaLabels.facebook')}
                          >
                            <BiLogoFacebook className="text-4xl" />
                          </motion.a>
                          <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 transform whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
                            {t('contactModal.tooltip.facebook')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default ContactModal;