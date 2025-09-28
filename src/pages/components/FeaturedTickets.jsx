import React, { useState, useEffect } from 'react'; 
import { BiReceipt} from 'react-icons/bi';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion'; 

const BACKEND_URL = import.meta.env.VITE_API_URL;

function FeaturedTickets({ activeCurrency, openModal }) {
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [error, setError] = useState(null); 

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!BACKEND_URL) {
          throw new Error('REACT_APP_BACKEND_URL is not defined.');
        }

        const currentLang = i18n.language || 'en';
        
        // *** PERUBAHAN 1: Atur limit ke 4 untuk mendapatkan 4 data tiket ***
        const response = await fetch(`${BACKEND_URL}/api/tickets?limit=4&lang=${currentLang}`); 
        
        if (!response.ok) {
          throw new Error('Failed to fetch tickets.');
        }
        const data = await response.json();
        setTickets(data.tickets); 
      } catch (err) {
        console.error('Error fetching featured tickets:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTickets();
  }, [i18n.language]); 

  // Tampilkan loading state
  if (isLoading) {
    return (
      <div className="mb-12">
        <h2 className="text-3xl font-bold text-havanaGray mb-6 flex items-center">
          <BiReceipt className="mr-2 text-havanaPink" />
          {t('featuredTickets.title')}
        </h2>
        {/* Skeleton untuk 4 item: 4 kolom di layar besar (lg:grid-cols-4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-4 animate-pulse h-48"></div>
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-4 animate-pulse h-48 hidden sm:block"></div>
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-4 animate-pulse h-48 hidden lg:block"></div>
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-4 animate-pulse h-48 hidden lg:block"></div>
        </div>
      </div>
    );
  }

  // Tampilkan error state
  if (error) {
    return (
      <div className="mb-12 text-center text-red-500">
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-3xl font-bold text-havanaGray mb-6 flex items-center">
        <BiReceipt className="mr-2 text-havanaPink" />
        {t('featuredTickets.title')}
      </h2>
      {/* *** PERUBAHAN 2: Menggunakan lg:grid-cols-4 untuk 4 kolom di layar besar *** */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {tickets.map((ticket) => (
          <motion.div 
            key={ticket._id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            viewport={{ once: true }}
            className="bg-white rounded-lg shadow-md p-6 sm:p-4 hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => openModal(ticket, 'ticket')}
          >
            <h3 className="text-lg font-semibold text-havanaGray flex items-center">
              <BiReceipt className="mr-2 text-havanaPink" />
              {ticket.destination?.name} 
            </h3>
            <p className="text-gray-600 mt-2">
              {ticket.description?.length > 50
                ? `${ticket.description.substring(0, 50)}...`
                : ticket.description || t('featuredTickets.noDescription')}
            </p>
            <div className="flex justify-between items-center mt-2">
              <p className="text-havanaBlue font-medium">
                {activeCurrency?.code} {ticket.price?.toLocaleString()} / {t('featuredTickets.perPerson')}
              </p>
              {ticket.tourType && (
                  <p className="text-gray-600 text-sm">{ticket.tourType}</p>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openModal(ticket, 'ticket');
                }}
                className="bg-havanaBlue text-white py-2 px-4 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors duration-200"
              >
                {t('featuredTickets.seeDetail')}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default FeaturedTickets;