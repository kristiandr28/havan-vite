import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BiShoppingBag,
  BiMap,
  BiWalk,
  BiPin,
  BiCartAdd,
  BiLogoWhatsapp,
} from 'react-icons/bi';
import { FaTicketAlt, FaRoute } from 'react-icons/fa';

// Placeholder for DetailBookModal since its code was not provided
const DetailBookModal = ({ isOpen, closeModal, selectedItem, modalType, activeCurrency, user, token }) => {
  const BACKEND_URL = import.meta.env.VITE_API_URL;
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10004]">
      <div className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full">
        <h2 className="text-2xl font-bold mb-4">{t('modals.detail.bookNow')}</h2>
        <p>{t('modals.detail.placeholder')}</p>
        <p>
          {t('modals.detail.placeholderDetails', {
            item: selectedItem.name,
            type: modalType,
          })}
        </p>
        <button
          onClick={closeModal}
          className="mt-4 py-2 px-4 bg-havanaPink text-white rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors duration-200"
        >
          {t('general.close')}
        </button>
      </div>
    </div>
  );
};


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

const iconMap = {
  tour: BiMap,
  activity: BiWalk,
  destination: BiPin,
  ticket: BiShoppingBag,
};

function DetailModal({
  isOpen,
  closeModal,
  selectedItem,
  modalType,
  activeCurrency,
  openItineraryModal,
  openImageModal,
  isFromBookingModal,
  descriptionError,
  BACKEND_URL,
  user,
  token,
  addToCart,
  openDetailModal,
}) {
  const { t, i18n } = useTranslation();
  const [isBookModalOpen, setIsBookModal] = useState(false);
  const [relatedTours, setRelatedTours] = useState([]);
  const [relatedTickets, setRelatedTickets] = useState([]);
  const [isLoadingRelated, setIsLoadingRelated] = useState(false);


  useEffect(() => {
    if (isOpen && modalType === 'destination' && selectedItem?._id) {
      const fetchRelatedItems = async () => {
        setIsLoadingRelated(true);
        try {
          const lang = i18n.language || 'en';
          const res = await fetch(`${BACKEND_URL}/api/destinations/details/${selectedItem._id}?lang=${lang}`);
          if (!res.ok) throw new Error('Failed to fetch related items');
          const data = await res.json();

          selectedItem.name = data.destination.name;
          selectedItem.description = data.destination.description;
          selectedItem.location = data.destination.location;
          selectedItem.image = data.destination.image;

          setRelatedTours(data.relatedTours || []);
          setRelatedTickets(data.relatedTickets || []);
        } catch (error) {
          console.error('Error fetching related items:', error);
          setRelatedTours([]);
          setRelatedTickets([]);
        } finally {
          setIsLoadingRelated(false);
        }
      };

      fetchRelatedItems();
    }
  }, [isOpen, modalType, selectedItem, BACKEND_URL, i18n.language]);

  if (!isOpen || !selectedItem) return null;

  const Icon = iconMap[modalType] || BiShoppingBag;
  const showAddToCartButton = modalType !== 'destination';

  const handleWhatsAppBook = () => {
    const phoneNumber = '6282189963527';
    const whatsappMessage = t('modals.detail.whatsappMessage', {
      item: modalType === 'ticket' ? selectedItem.destination?.name : selectedItem.name,
      type: t(`modalType.${modalType}`),
      currency: activeCurrency?.code,
      price: selectedItem.price?.toLocaleString(),
    });
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleItemClick = (item, type) => {
    closeModal();
    openDetailModal(item, type);
  };

  // Fungsi utilitas untuk menerjemahkan item berdasarkan bahasa yang aktif
  const getTranslatedName = (item, langCode = t('languageCode')) => {
    if (!item?.translations) {
      return item?.name || item.destination?.name || t('general.none');
    }
    const translation = item.translations.find(t => t.language?.code === langCode);
    return translation?.name || item?.name || t('general.none');
  };

  const getTranslatedDescription = (item, langCode = t('languageCode')) => {
    if (!item?.translations) {
      return item?.description || t('general.noDescription');
    }
    const translation = item.translations.find(t => t.language?.code === langCode);
    return translation?.description || item?.description || t('general.noDescription');
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[10003]"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={closeModal}
          >
            <motion.div
              className="bg-white rounded-xl shadow-2xl w-full max-w-4xl sm:max-w-2xl mx-2 p-8 sm:p-6 xs:p-4 max-h-[85vh] overflow-y-auto"
              style={{ backgroundColor: '#ffffff' }}
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4 min-w-0">
                  {modalType !== 'ticket' && (
                    <>
                      {selectedItem.image ? (
                        <img
                          src={`${BACKEND_URL}${selectedItem.image}`}
                          alt={t(`modalType.${modalType}`)}
                          className="w-full h-80 md:h-64 sm:h-48 object-cover rounded-lg cursor-pointer"
                          onClick={() => openImageModal(`${BACKEND_URL}${selectedItem.image}`)}
                          onError={(e) => {
                            console.error(`Modal image load error for ${t(`modalType.${modalType}`)}:`, `${BACKEND_URL}${selectedItem.image}`);
                            e.target.src = 'https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-80 md:h-64 sm:h-48 bg-gray-200 flex items-center justify-center rounded-lg">
                          <span className="text-gray-500 text-sm">{t('general.noImage')}</span>
                        </div>
                      )}
                    </>
                  )}
                  <h3 className="text-2xl sm:text-xl font-bold text-havanaGray flex items-center">
                    <Icon className="mr-2 text-havanaPink" />
                    {getTranslatedName(selectedItem)}
                  </h3>
                  <div>
                    <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.description')}</h4>
                    <p className="text-havanaGray text-sm">
                      {getTranslatedDescription(selectedItem)}
                    </p>
                    {descriptionError && <p className="text-red-500 text-sm mt-1">{descriptionError}</p>}
                  </div>
                </div>
                <div className="space-y-4 min-w-0">
                  {modalType === 'ticket' ? (
                    <>
                      <div>
                        <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.ticketType')}</h4>
                        <p className="text-havanaGray text-sm">
                          {selectedItem.ticketType?.join(', ') || t('general.none')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('general.price')}</h4>
                        <p className="text-havanaGray text-sm">
                          {activeCurrency?.code} {selectedItem.price?.toLocaleString()} / {t('modals.detail.perPerson')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.departureLocation')}</h4>
                        <p className="text-havanaGray text-sm">
                          {getTranslatedName(selectedItem.departureLocation)}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.perPerson')}</h4>
                        <p className="text-havanaGray text-sm">{selectedItem.pax || t('general.none')} pax</p>
                      </div>
                    </>
                  ) : modalType === 'destination' ? (
                    <>
                      <div>
                        <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.location')}</h4>
                        <p className="text-havanaGray text-sm">
                          {getTranslatedName(selectedItem.location)}
                        </p>
                      </div>
                    <div>
                      <h4 className="text-lg sm:text-base font-semibold text-havanaGray">
                        {t('modals.detail.relatedTours')}
                      </h4>
                      {isLoadingRelated ? (
                        <p className="text-havanaGray text-sm">{t('general.loading')}</p>
                      ) : relatedTours.length > 0 ? (
                        <ul className="list-none space-y-2 pl-0">
                          {relatedTours.map((tour) => (
                            <li
                              key={tour._id}
                              className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-200"
                              onClick={() => handleItemClick(tour, 'tour')}
                            >
                              <FaRoute className="text-havanaBlue text-xl" />
                              <span className="font-medium text-havanaGray">{tour.name}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-havanaGray text-sm">{t('general.noRelatedTours')}</p>
                      )}
                    </div>

                      <div>
                        <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.relatedTickets')}</h4>
                        {isLoadingRelated ? (
                          <p className="text-havanaGray text-sm">{t('general.loading')}</p>
                        ) : relatedTickets.length > 0 ? (
                          <ul className="list-none space-y-2 pl-0">
                            {relatedTickets.map((ticket) => (
                              <li key={ticket._id} className="flex items-center space-x-2 p-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors duration-200" onClick={() => handleItemClick(ticket, 'ticket')}>
                                <FaTicketAlt className="text-havanaBlue text-xl" />
                                <span className="font-medium text-havanaGray">{getTranslatedName(ticket.destination)} ({t('modalType.ticket')})</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-havanaGray text-sm">{t('general.noRelatedTickets')}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {modalType !== 'destination' && (
                        <div>
                          <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('general.price')}</h4>
                          <p className="text-havanaGray text-sm">
                            {activeCurrency?.code} {selectedItem.price?.toLocaleString()}
                            {modalType === 'activity' &&
                              ` ${t('general.for')} ${selectedItem.pax} ${selectedItem.pax > 1 ? t('general.people') : t('general.person')}`}
                          </p>
                        </div>
                      )}
                      {modalType !== 'destination' && (
                        <div>
                          <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('general.duration')}</h4>
                          <p className="text-havanaGray text-sm">{selectedItem.duration || t('general.none')}</p>
                        </div>
                      )}
                      {modalType === 'activity' && (
                        <div>
                          <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('general.category')}</h4>
                          <p className="text-havanaGray text-sm">
                            {typeof selectedItem.category === 'object' && selectedItem.category?.name
                              ? selectedItem.category.name
                              : selectedItem.category || t('general.none')}
                          </p>
                        </div>
                      )}
                      {modalType === 'tour' && (
                        <>
                          <div>
                            <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.tourType')}</h4>
                            <p className="text-havanaGray text-sm">{selectedItem.tourType || t('general.none')}</p>
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.maxPax')}</h4>
                            <p className="text-havanaGray text-sm">{selectedItem.maxPax || t('general.none')}</p>
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.guideLanguages')}</h4>
                            <p className="text-havanaGray text-sm">
                              {selectedItem.guideLanguages?.map((lang) => lang.name).join(', ') || t('general.none')}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('modals.detail.destinations')}</h4>
                            <p className="text-havanaGray text-sm">
                              {selectedItem.destinations?.map(dest => getTranslatedName(dest)).join(', ') || t('general.none')}
                            </p>
                          </div>
                          <div className="mt-4">
                            <button
                              onClick={() => openItineraryModal(selectedItem)}
                              className="w-full bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
                            >
                              {t('modals.detail.detailItinerary')}
                            </button>
                          </div>
                        </>
                      )}
                      {modalType !== 'destination' && (
                        <>
                          <div>
                            <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('general.included')}</h4>
                            <ul className="list-disc pl-5 text-havanaGray text-sm">
                              {selectedItem.included?.length > 0 ? (
                                selectedItem.included.map((item, index) => (
                                  <li key={index}>{getTranslatedName(item)}</li>
                                ))
                              ) : (
                                <li>{t('general.none')}</li>
                              )}
                            </ul>
                          </div>
                          <div>
                            <h4 className="text-lg sm:text-base font-semibold text-havanaGray">{t('general.excluded')}</h4>
                            <ul className="list-disc pl-5 text-havanaGray text-sm">
                              {selectedItem.excluded?.length > 0 ? (
                                selectedItem.excluded.map((item, index) => (
                                  <li key={index}>{getTranslatedName(item)}</li>
                                ))
                              ) : (
                                <li>{t('general.none')}</li>
                              )}
                            </ul>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-2">
                {!isFromBookingModal && modalType !== 'destination' && (
                  <button
                    onClick={handleWhatsAppBook}
                    className="py-2 px-4 bg-green-500 text-white rounded-md text-sm font-semibold hover:bg-green-600 transition-colors duration-200 flex items-center"
                    title={t('modals.detail.whatsappTitle')}
                  >
                    <BiLogoWhatsapp className="mr-2 text-lg" /> {t('modals.detail.bookViaWhatsapp')}
                  </button>
                )}
                {!isFromBookingModal && showAddToCartButton && (
                  <button
                    onClick={() => {
                      addToCart(selectedItem, 1, modalType);
                      closeModal();
                    }}
                    className="py-2 px-4 bg-havanaBlue text-white rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200 flex items-center"
                  >
                    <BiCartAdd className="mr-2" /> {t('modals.detail.addToCart')}
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="py-2 px-4 bg-havanaPink text-white rounded-md text-sm font-semibold hover:bg-pink-700 transition-colors duration-200"
                >
                  {t('general.close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <DetailBookModal
        isOpen={isBookModalOpen}
        closeModal={() => setIsBookModal(false)}
        closeParentModal={closeModal}
        selectedItem={selectedItem}
        modalType={modalType}
        activeCurrency={activeCurrency}
        BACKEND_URL={BACKEND_URL}
        user={user}
        token={token}
      />
    </>
  );
}

export default DetailModal;