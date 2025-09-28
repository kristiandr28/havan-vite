import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { BiReceipt, BiX, BiSearch, BiLoaderAlt } from 'react-icons/bi';

// IMPORT VARIAN DARI FILE EKSTERNAL
import { modalVariants, contentVariants, childVariants } from './modalVariants';

const BACKEND_URL = import.meta.env.VITE_API_URL;

function TicketModal({ isOpen, closeModal, activeCurrency, openDetailModal }) {
  const { t, i18n } = useTranslation();
  
  // State untuk data dari API
  const [allTickets, setAllTickets] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // State untuk filter dan pencarian
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDestination, setSelectedDestination] = useState('');
  const [selectedTicketType, setSelectedTicketType] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState('');
  const [filteredTickets, setFilteredTickets] = useState([]);

  // Ambil data tiket saat modal terbuka atau bahasa berubah
  useEffect(() => {
    if (!isOpen) return;

    const fetchTickets = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `${BACKEND_URL}/api/tickets?limit=10&lang=${i18n.language}`
        );
        if (!res.ok) throw new Error(t('ticketModal.fetchError'));
        const data = await res.json();
        setAllTickets(data.tickets || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [isOpen, i18n.language, t]);

  // Reset filter saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setSearchTerm('');
      setSelectedDestination('');
      setSelectedTicketType('');
      setSelectedPriceRange('');
    }
  }, [isOpen]);

  // Filter tiket berdasarkan state filter
  const applyFilters = useCallback(() => {
    let currentFiltered = allTickets;

    if (searchTerm) {
      currentFiltered = currentFiltered.filter(ticket =>
        ticket.destination?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ticket.ticketType?.some(type => type.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedDestination) {
      currentFiltered = currentFiltered.filter(ticket =>
        ticket.destination?.name === selectedDestination
      );
    }

    if (selectedTicketType) {
      currentFiltered = currentFiltered.filter(ticket =>
        ticket.ticketType?.includes(selectedTicketType)
      );
    }

    if (selectedPriceRange) {
      const [min, max] = selectedPriceRange.split('-').map(val => (val ? parseInt(val) : Infinity));
      currentFiltered = currentFiltered.filter(ticket =>
        ticket.price >= (min || 0) && ticket.price <= (max || Infinity)
      );
    }

    setFilteredTickets(currentFiltered);
  }, [allTickets, searchTerm, selectedDestination, selectedTicketType, selectedPriceRange]);

  // Terapkan filter setiap kali allTickets atau state filter berubah
  useEffect(() => {
    applyFilters();
  }, [applyFilters, allTickets]);

  // Data unik untuk dropdown filter
  const uniqueDestinations = Array.from(new Set(allTickets.map(ticket => ticket.destination?.name))).filter(Boolean).sort();
  const uniqueTicketTypes = Array.from(new Set(
    allTickets.flatMap(ticket => ticket.ticketType)
      .filter(type => typeof type === 'string' && type.trim() !== '')
  )).sort();
  const priceRanges = [
    { label: t('ticketModal.allPrices'), value: '' },
    { label: t('ticketModal.underPrice', { price: `${activeCurrency?.code} 500K` }), value: '0-500000' },
    { label: t('ticketModal.priceRange', { minPrice: `${activeCurrency?.code} 500K`, maxPrice: '1M' }), value: '500000-1000000' },
    { label: t('ticketModal.overPrice', { price: `${activeCurrency?.code} 1M` }), value: '1000000-' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          // GUNAKAN modalVariants dari impor
          variants={modalVariants} 
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
          key="modal-overlay"
        >
          <motion.div
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-4xl shadow-lg max-h-[80vh] overflow-y-auto"
            // GUNAKAN contentVariants dari impor
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
                <BiReceipt className="text-havanaBlue text-xl" />
                <h3 className="text-base sm:text-lg font-semibold text-havanaGray">{t('ticketModal.title')}</h3>
              </div>
              <button onClick={closeModal} className="text-gray-600 hover:text-gray-800" aria-label={t('ariaLabels.closeModal')}>
                <BiX className="text-xl" />
              </button>
            </motion.div>

            {/* Filter Section */}
            <motion.div variants={childVariants} className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Search Input */}
              <div className="relative col-span-full lg:col-span-1">
                <input
                  type="text"
                  placeholder={t('ticketModal.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-havanaPink"
                />
                <BiSearch className="absolute left-3 top-3 text-gray-400" />
              </div>

              {/* Destination Filter */}
              <div className="col-span-1">
                <select
                  value={selectedDestination}
                  onChange={(e) => setSelectedDestination(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-havanaPink"
                >
                  <option value="">{t('ticketModal.allDestinations')}</option>
                  {uniqueDestinations.map(dest => (
                    <option key={dest} value={dest}>{dest}</option>
                  ))}
                </select>
              </div>

              {/* Ticket Type Filter */}
              <div className="col-span-1">
                <select
                  value={selectedTicketType}
                  onChange={(e) => setSelectedTicketType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-havanaPink"
                >
                  <option value="">{t('ticketModal.allTicketTypes')}</option>
                  {uniqueTicketTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Price Range Filter */}
              <div className="col-span-1">
                <select
                  value={selectedPriceRange}
                  onChange={(e) => setSelectedPriceRange(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-havanaPink"
                >
                  {priceRanges.map(range => (
                    <option key={range.value} value={range.value}>{range.label}</option>
                  ))}
                </select>
              </div>
            </motion.div>
            {/* End Filter Section */}

            {loading && (
              <motion.div variants={childVariants} className="flex flex-col items-center justify-center p-8">
                <BiLoaderAlt className="animate-spin text-havanaPink text-4xl mb-2" />
                <p className="text-gray-600 font-medium">{t('common.loading')}</p>
              </motion.div>
            )}

            {error && !loading && (
              <motion.p
                className="text-red-500 mb-4 sm:text-sm text-[15px]"
                variants={childVariants}
              >
                {t('ticketModal.fetchError')}: {error}
              </motion.p>
            )}

            {!loading && filteredTickets.length > 0 ? (
              <motion.div
                className="grid sm:grid-cols-2 grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6"
                // Menggunakan variants={contentVariants} di parent yang sudah mengatur stagger children, 
                // jadi childVariants akan diatur oleh 'when: beforeChildren' di contentVariants.
              >
                {filteredTickets.map((ticket) => (
                  <motion.div
                    key={ticket._id}
                    className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-200"
                    variants={childVariants} // Digunakan di sini untuk setiap item
                  >
                    <h4 className="text-base font-semibold text-havanaGray flex items-center">
                      <BiReceipt className="mr-2 text-havanaPink" />
                      {ticket.destination?.name || t('ticketModal.noDestination')}
                    </h4>
                    <p className="text-gray-600 sm:text-sm mt-2 text-[14px]">
                      {ticket.description && ticket.description.length > 50
                        ? `${ticket.description.substring(0, 50)}...`
                        : ticket.description || t('ticketModal.noDescription')}
                    </p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-havanaBlue sm:text-sm font-medium text-[14px]">
                        {activeCurrency?.code} {ticket.price?.toLocaleString()} / {t('ticketModal.perPerson')}
                      </p>
                      <p className="text-gray-600 sm:text-xs text-[13px]">{ticket.ticketType?.join(', ') || t('ticketModal.na')}</p>
                    </div>
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => openDetailModal(ticket, 'ticket')}
                        className="bg-havanaBlue text-white py-1 px-3 rounded-md sm:text-sm font-semibold text-[11px] hover:bg-blue-700 transition-colors duration-200"
                      >
                        {t('ticketModal.seeDetail')}
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              !loading && (
                <motion.p
                  className="sm:text-sm text-[15px] text-gray-600 text-center py-8"
                  variants={childVariants}
                >
                  {error ? '' : (allTickets.length > 0 ? t('ticketModal.noMatch') : t('ticketModal.noTickets'))}
                </motion.p>
              )
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default TicketModal;