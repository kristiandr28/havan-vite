import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { BiCalendar } from 'react-icons/bi';
import HeroSection from './components/HeroSection';
import FeaturedTours from './components/FeaturedTours';
import PopularActivities from './components/PopularActivities';
import FeaturedDestinations from './components/FeaturedDestinations';
import FeaturedTickets from './components/FeaturedTickets';
import FeaturedPhotos from './components/FeaturedPhotos';
import Reviews from './components/Reviews';
import BookingModal from './components/BookingModal';
import ItineraryModal from './components/ItineraryModal';
import ImageModal from './components/ImageModal';
import AboutUsSection from './components/AboutUsSection';
import WhyChooseHavanaModal from './components/WhyChooseHavanaModal';
import CustomizationModal from './components/CustomizationModal';
import FeatureIndicator from './components/FeatureIndicator';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';

const BACKEND_URL = import.meta.env.VITE_API_URL;; // Default fallback URL

function Home({ openDetailModal, activeCurrency, BACKEND_URL: appBackendUrl }) {
  const { user, token } = useAuth();
  const [tours, setTours] = useState([]);
  const [activities, setActivities] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [heroes, setHeroes] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [localActiveCurrency, setLocalActiveCurrency] = useState(activeCurrency);
  const [currentHero, setCurrentHero] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [isWhyChooseHavanaModalOpen, setIsWhyChooseHavanaModalOpen] = useState(false);
  const [isCustomizationModalOpen, setIsCustomizationModalOpen] = useState(false);

  const [selectedItemForItinerary, setSelectedItemForItinerary] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedServiceType, setSelectedServiceType] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const [bookingStep, setBookingStep] = useState(1);
  const datePickerRef = useRef(null);

  const [showFeatureIndicator, setShowFeatureIndicator] = useState(false);

  const effectiveBackendUrl = appBackendUrl || BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [heroesRes, toursRes, activitiesRes, destinationsRes, ticketsRes, photosRes, reviewsRes, currencyRes] = await Promise.all([
          axios.get(`${effectiveBackendUrl}/api/heroes`),
          axios.get(`${effectiveBackendUrl}/api/tours`),
          axios.get(`${effectiveBackendUrl}/api/activities`),
          axios.get(`${effectiveBackendUrl}/api/destinations`),
          axios.get(`${effectiveBackendUrl}/api/tickets`),
          axios.get(`${effectiveBackendUrl}/api/photos`),
          axios.get(`${effectiveBackendUrl}/api/reviews`),
          axios.get(`${effectiveBackendUrl}/api/currencies/active`),
        ]);

        // LOG RAW DATA
        console.log('--- RAW DATA FROM API ---');
        console.log('Raw Heroes:', heroesRes.data);
        console.log('Raw Tours:', toursRes.data);
        console.log('Raw Activities:', activitiesRes.data);
        console.log('Raw Destinations:', destinationsRes.data);
        console.log('Raw Tickets:', ticketsRes.data);
        console.log('Raw Photos:', photosRes.data);
        console.log('Raw Reviews:', reviewsRes.data);
        console.log('Raw Currency:', currencyRes.data);
        console.log('-------------------------');

        // === PERBAIKAN DI SINI: Akses properti 'tours', 'activities', 'tickets' ===
        const toursData = Array.isArray(toursRes.data.tours) ? toursRes.data.tours : [];
        const activitiesData = Array.isArray(activitiesRes.data.activities) ? activitiesRes.data.activities : [];
        const ticketsData = Array.isArray(ticketsRes.data.tickets) ? ticketsRes.data.tickets : [];
        // =========================================================================

        const validTours = toursData
          .filter(
            (tour) =>
              tour.price != null &&
              tour.maxPax != null &&
              tour.maxPax >= 1 &&
              tour.maxPax <= 10 &&
              tour.description?.length <= 3000 &&
              tour.description?.split('.').filter((s) => s.trim()).length <= 3
          );
        const invalidTours = toursData.filter(
          (tour) =>
            tour.price == null ||
            tour.maxPax == null ||
            tour.maxPax < 1 ||
            tour.maxPax > 10 ||
            tour.description?.length > 3000 ||
            tour.description?.split('.').filter((s) => s.trim()).length > 3
        );

        const validActivities = activitiesData
            .filter(
                (activity) =>
                    activity.price != null &&
                    activity.pax != null &&
                    activity.pax >= 1 &&
                    activity.description?.length <= 3000 &&
                    activity.description?.split('.').filter((s) => s.trim()).length <= 3
            );
        const invalidActivities = activitiesData.filter(
            (activity) =>
                activity.price == null ||
                activity.pax == null ||
                activity.pax < 1 ||
                activity.description?.length > 3000 ||
                activity.description?.split('.').filter((s) => s.trim()).length > 3
        );

        const photosData = Array.isArray(photosRes.data) ? photosRes.data : [];
        const validPhotos = photosData
          .filter(
            (photo) =>
              photo.filename &&
              photo.path &&
              photo.path.startsWith('/uploads/gallery/') &&
              photo.filename.length <= 100
          );
        const invalidPhotos = photosData.filter(
          (photo) =>
            !photo.filename ||
            !photo.path ||
            !photo.path.startsWith('/uploads/gallery/') ||
            photo.filename.length > 100
        );


        const validTickets = ticketsData
          .filter(
            (ticket) =>
              ticket.price != null &&
              ticket.pax != null &&
              ticket.pax >= 1 &&
              ticket.destination != null &&
              ticket.ticketType?.length > 0 &&
              ticket.description?.length <= 3000
          );
        const invalidTickets = ticketsData.filter(
          (ticket) =>
            ticket.price == null ||
            ticket.pax == null ||
            ticket.pax < 1 ||
            ticket.destination == null ||
            !ticket.ticketType?.length ||
            ticket.description?.length > 3000
        );

        const reviewsData = Array.isArray(reviewsRes.data) ? reviewsRes.data : [];
        const validReviews = reviewsData
          .filter(
            (review) =>
              review.userName &&
              review.rating >= 1 &&
              review.rating <= 5 &&
              review.comment &&
              review.comment.length <= 500
          );
        const invalidReviews = reviewsData.filter(
          (review) =>
            !review.userName ||
            review.rating < 1 ||
            review.rating > 5 ||
            !review.comment ||
            review.comment.length > 500
        );

        // LOG VALID AND INVALID DATA BEFORE SLICE
        console.log('--- FILTERED DATA (before final slice) ---');
        console.log('Valid Tours (full list):', validTours.map((t) => ({ _id: t._id, name: t.name, price: t.price, maxPax: t.maxPax, tourType: t.tourType })));
        console.log('Invalid tours:', invalidTours.map((t) => ({ _id: t._id, name: t.name, price: t.price, maxPax: t.maxPax, descriptionLength: t.description?.length || 'N/A' })));
        
        console.log('Valid Activities (full list):', validActivities.map((a) => ({ _id: a._id, name: a.name, price: a.price, pax: a.pax, category: a.category })));
        console.log('Invalid activities:', invalidActivities.map((a) => ({ _id: a._id, name: a.name, price: a.price, pax: a.pax, descriptionLength: a.description?.length || 'N/A' })));

        console.log('Valid Tickets (full list):', validTickets.map((t) => ({ _id: t._id, destination: t.destination?.name, ticketType: t.ticketType, price: t.price, pax: t.pax })));
        console.log('Invalid tickets:', invalidTickets.map((t) => ({ _id: t._id, destination: t.destination?.name, ticketType: t.ticketType, price: t.price, pax: t.pax, descriptionLength: t.description?.length || 'N/A' })));
        
        console.log('Valid Photos (full list):', validPhotos.map((p) => ({ _id: p._id, filename: p.filename, path: p.path })));
        console.log('Invalid photos:', invalidPhotos.map((p) => ({ _id: p._id, filename: p.filename, path: p.path, filenameLength: p.filename?.length || 'N/A' })));
        
        console.log('Valid Reviews (full list):', validReviews.map((r) => ({ _id: r._id, userName: r.userName, rating: r.rating })));
        console.log('Invalid reviews:', invalidReviews.map((r) => ({ _id: r._id, userName: r.userName, rating: r.rating, commentLength: r.comment?.length || 'N/A' })));
        console.log('-------------------------------------------');


        // Set state with sliced valid data
        setHeroes(heroesRes.data);
        setTours(validTours.slice(0, 6)); // Apply slice here
        setActivities(validActivities.slice(0, 6)); // Apply slice here
        setDestinations(Array.isArray(destinationsRes.data) ? destinationsRes.data.slice(0, 6) : []);
        setTickets(validTickets.slice(0, 6)); // Apply slice here
        setPhotos(validPhotos.slice(0, 18)); // Apply slice here
        setReviews(validReviews.slice(0, 6)); // Apply slice here
        setLocalActiveCurrency(currencyRes.data);

        // Set general error message if any invalid data was found
        let combinedError = '';
        if (invalidTours.length > 0) {
            combinedError += `Some tours were skipped due to invalid data (${invalidTours.length} tours). `;
        }
        if (invalidActivities.length > 0) {
            combinedError += `Some activities were skipped due to invalid data (${invalidActivities.length} activities). `;
        }
        if (invalidTickets.length > 0) {
            combinedError += `Some tickets were skipped due to invalid data (${invalidTickets.length} tickets). `;
        }
        if (invalidPhotos.length > 0) {
            combinedError += `Some photos were skipped due to invalid data (${invalidPhotos.length} photos). `;
        }
        if (invalidReviews.length > 0) {
            combinedError += `Some reviews were skipped due to invalid data (${invalidReviews.length} reviews). `;
        }
        setError(combinedError.trim());

      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to fetch data');
        setLocalActiveCurrency({ code: 'IDR' });
      }
    };
    fetchData();
  }, [effectiveBackendUrl]);

  useEffect(() => {
    if (heroes.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentHero((prev) => (prev + 1) % heroes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [heroes, isPaused]);

  useEffect(() => {
    const handleScrollVisibility = () => {
      const aboutUsSection = document.getElementById('about-us-section');
      if (aboutUsSection) {
        const rect = aboutUsSection.getBoundingClientRect();
        const shouldShow = rect.top <= window.innerHeight * 0.4;
        setShowFeatureIndicator(shouldShow);
      } else {
        setShowFeatureIndicator(false);
      }
    };

    window.addEventListener('scroll', handleScrollVisibility);
    handleScrollVisibility();

    return () => {
      window.removeEventListener('scroll', handleScrollVisibility);
    };
  }, []);

  const modalHandlers = {
    openItineraryModal: (tour) => {
      setSelectedItemForItinerary(tour);
      setItineraryModalOpen(true);
      console.log('Opening itinerary modal for:', tour.name);
    },
    closeItineraryModal: () => {
      setItineraryModalOpen(false);
      setSelectedItemForItinerary(null);
      console.log('Closing itinerary modal');
    },
    openImageModal: (image) => {
      setSelectedImage(image);
      setImageModalOpen(true);
      console.log('Opening image modal for:', image);
    },
    closeImageModal: () => {
      setImageModalOpen(false);
      setSelectedImage(null);
      console.log('Closing image modal');
    },
    openBookingModal: () => {
      setBookingModalOpen(true);
      setSelectedServiceType('');
      setSelectedService('');
      setSelectedDate('');
      setBookingStep(1);
      setError('');
      console.log('Opening booking modal');
    },
    closeBookingModal: () => {
      setBookingModalOpen(false);
      setSelectedServiceType('');
      setSelectedService('');
      setSelectedDate('');
      setBookingStep(1);
      setError('');
      console.log('Closing booking modal');
    },
    openWhyChooseHavanaModal: () => {
      setIsWhyChooseHavanaModalOpen(true);
      console.log('Opening Why Choose Havana modal');
    },
    closeWhyChooseHavanaModal: () => {
      setIsWhyChooseHavanaModalOpen(false);
      console.log('Closing Why Choose Havana modal');
    },
    openCustomizationModal: () => {
      setIsCustomizationModalOpen(true);
      console.log('Opening Customization modal');
    },
    closeCustomizationModal: () => {
      setIsCustomizationModalOpen(false);
      console.log('Closing Customization modal');
    },
  };

  const bookingHandlers = {
    handleBookingSubmit: () => {
      if (!selectedServiceType || !selectedService) {
        setError('Please select a service type and service');
        return false;
      }
      let serviceName;
      if (selectedServiceType === 'tour') {
        serviceName = tours.find((t) => t._id === selectedService)?.name;
      } else if (selectedServiceType === 'activity') {
        serviceName = activities.find((a) => a._id === selectedService)?.name;
      } else {
        const ticket = tickets.find((t) => t._id === selectedService);
        serviceName = ticket ? `${ticket.destination?.name} (${ticket.ticketType.join(', ')})` : 'Unknown';
      }
      console.log('Booking submitted:', {
        serviceType: selectedServiceType,
        serviceId: selectedService,
        serviceName,
        date: selectedDate || 'Not specified',
      });
      modalHandlers.closeBookingModal();
      return true;
    },
    handleSeeDetail: () => {
      if (!selectedServiceType || !selectedService) return;
      let selectedItem;
      if (selectedServiceType === 'tour') {
        selectedItem = tours.find((t) => t._id === selectedService);
      } else if (selectedServiceType === 'activity') {
        selectedItem = activities.find((a) => a._id === selectedService);
      } else {
        selectedItem = tickets.find((t) => t._id === selectedService);
      }
      if (selectedItem) {
        openDetailModal(selectedItem, selectedServiceType, true);
        console.log(`Opening detail modal from booking for ${selectedServiceType}:`, selectedItem.name || selectedItem.destination?.name);
      }
    },
    handleDatePickerClick: () => {
      if (datePickerRef.current) {
        datePickerRef.current.showPicker();
      }
    },
    nextStep: () => {
      if (bookingStep === 1 && !selectedServiceType) {
        setError('Please select a service type');
        return;
      }
      if (bookingStep === 2 && !selectedService) {
        setError('Please select a service');
        return;
      }
      setError('');
      setBookingStep((prev) => Math.min(prev + 1, 3));
    },
    prevStep: () => {
      setError('');
      setBookingStep((prev) => Math.max(prev - 1, 1));
    },
  };

  const heroHandlers = {
    goToNext: () => setCurrentHero((prev) => (prev + 1) % heroes.length),
    goToPrev: () => setCurrentHero((prev) => (prev - 1 + heroes.length) % heroes.length),
    goToHero: (index) => setCurrentHero(index),
  };

  const featureSections = [
    { id: 'hero-section', name: 'Home' },
    { id: 'about-us-section', name: 'About Us' },
    { id: 'featured-tours-section', name: 'Tours' },
    { id: 'popular-activities-section', name: 'Activities' },
    { id: 'featured-destinations-section', name: 'Destinations' },
    { id: 'featured-tickets-section', name: 'Tickets' },
    { id: 'reviews-section', name: 'Reviews' },
    { id: 'featured-photos-section', name: 'Gallery' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <section id="hero-section">
        <HeroSection
          heroes={heroes}
          currentHero={currentHero}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          {...heroHandlers}
          BACKEND_URL={effectiveBackendUrl}
        />
      </section>

      {/* <motion.button
        onClick={modalHandlers.openBookingModal}
        className="fixed bottom-6 right-6 bg-havanaPink text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-pink-700 sm:text-lg font-semibold z-50"
        whileHover={{ scale: 1.1, boxShadow: '0 0 15px rgba(240, 98, 146, 0.5)' }}
        whileTap={{ scale: 0.95 }}
        animate={{ scale: [1, 1.05, 1], transition: { repeat: Infinity, duration: 1.5 } }}
        title="Book Your Adventure"
      >
        <BiCalendar className="text-2xl" />
      </motion.button>*/}

      <div className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <section id="about-us-section">
          <AboutUsSection
            openWhyChooseHavanaModal={modalHandlers.openWhyChooseHavanaModal}
            openCustomizationModal={modalHandlers.openCustomizationModal}
          />
        </section>

        <section id="featured-tours-section">
          <FeaturedTours
            tours={tours}
            activeCurrency={localActiveCurrency}
            openModal={(item) => openDetailModal(item, 'tour')}
            BACKEND_URL={effectiveBackendUrl}
          />
        </section>

        <section id="popular-activities-section">
          <PopularActivities
            activities={activities}
            activeCurrency={localActiveCurrency}
            openModal={(item) => openDetailModal(item, 'activity')}
            BACKEND_URL={effectiveBackendUrl}
          />
        </section>

        <section id="featured-destinations-section">
          <FeaturedDestinations
            destinations={destinations}
            openModal={(item) => openDetailModal(item, 'destination')}
            BACKEND_URL={effectiveBackendUrl}
          />
        </section>

        <section id="featured-tickets-section">
          <FeaturedTickets
            tickets={tickets}
            activeCurrency={localActiveCurrency}
            openModal={(item) => openDetailModal(item, 'ticket')}
            BACKEND_URL={effectiveBackendUrl}
          />
        </section>

        <section id="reviews-section">
          <Reviews
            BACKEND_URL={effectiveBackendUrl}
          />
        </section>

        <section id="featured-photos-section">
          <FeaturedPhotos
            photos={photos}
            openModal={(item) => openDetailModal(item, 'photo')}
            BACKEND_URL={effectiveBackendUrl}
          />
        </section>

        {/* Modals */}
        {/*<BookingModal
          isOpen={bookingModalOpen}
          closeModal={modalHandlers.closeBookingModal}
          bookingStep={bookingStep}
          selectedServiceType={selectedServiceType}
          setSelectedServiceType={setSelectedServiceType}
          selectedService={selectedService}
          setSelectedService={setSelectedService}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          tours={tours}
          activities={activities}
          tickets={tickets}
          error={error}
          datePickerRef={datePickerRef}
          {...bookingHandlers}
        />*/}
        <ItineraryModal
          isOpen={itineraryModalOpen}
          closeModal={modalHandlers.closeItineraryModal}
          selectedItem={selectedItemForItinerary}
        />
        <ImageModal
          isOpen={imageModalOpen}
          closeModal={modalHandlers.closeImageModal}
          selectedImage={selectedImage}
        />

        <WhyChooseHavanaModal
          isOpen={isWhyChooseHavanaModalOpen}
          closeModal={modalHandlers.closeWhyChooseHavanaModal}
        />
        <CustomizationModal
          isOpen={isCustomizationModalOpen}
          closeModal={modalHandlers.closeCustomizationModal}
        />
      </div>

      {showFeatureIndicator && (
        <FeatureIndicator featureSections={featureSections} />
      )}
    </div>
  );
}

export default Home;