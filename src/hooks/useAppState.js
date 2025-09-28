import { useState, useEffect } from 'react';

const useAppState = () => {
  const [cartItems, setCartItems] = useState(JSON.parse(localStorage.getItem('cartItems')) || []);
  const [itemDetails, setItemDetails] = useState(JSON.parse(localStorage.getItem('itemDetails')) || []);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItemForDetail, setSelectedItemForDetail] = useState(null);
  const [detailModalType, setDetailModalType] = useState('');
  const [detailModalDescriptionError, setDetailModalDescriptionError] = useState('');
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [selectedItemForItinerary, setSelectedItemForItinerary] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageForModal, setSelectedImageForModal] = useState('');
  const [activeCurrency, setActiveCurrency] = useState({ code: 'IDR', name: 'Indonesian Rupiah' });

  useEffect(() => {
    localStorage.setItem('cartItems', JSON.stringify(cartItems));
    localStorage.setItem('itemDetails', JSON.stringify(itemDetails));
  }, [cartItems, itemDetails]);

  useEffect(() => {
    const wasCartOpen = localStorage.getItem('wasCartOpen');
    if (wasCartOpen === 'true') {
      console.log('Reopening CartModal from useAppState');
      setIsCartModalOpen(true);
      localStorage.removeItem('wasCartOpen');
    }
  }, []);

  const openCartModal = () => {
    setIsCartModalOpen(true);
    localStorage.setItem('wasCartOpen', 'true');
  };

  const closeCartModal = () => {
    setIsCartModalOpen(false);
    localStorage.removeItem('wasCartOpen');
  };

  const openCheckoutModal = () => {
    setIsCheckoutModalOpen(true);
    setIsCartModalOpen(false);
    localStorage.removeItem('wasCartOpen');
  };

  const closeCheckoutModal = () => {
    setIsCheckoutModalOpen(false);
  };

  const addToCart = (item, quantity = 1, type) => {
    if (!item._id) {
      console.error('addToCart: Item missing _id', item);
      return;
    }
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((cartItem) => cartItem._id === item._id);
      if (existingItem) {
        return prevItems.map((cartItem) =>
          cartItem._id === item._id
            ? { ...cartItem, quantity: cartItem.quantity + quantity }
            : cartItem
        );
      } else {
        return [
          ...prevItems,
          {
            ...item,
            quantity,
            modalType: type,
            price: item.price || 0,
            destination: item.destination || { name: item.name || 'Unknown Item' },
            maxPax: item.maxPax || null,
          },
        ];
      }
    });
    openCartModal();
  };

  const removeFromCart = (itemId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item._id !== itemId));
    setItemDetails((prevDetails) => prevDetails.filter((detail) => detail.itemId !== itemId));
  };

  const updateCartItemQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(itemId);
      return;
    }
    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
    setItemDetails((prevDetails) =>
      prevDetails.map((detail) =>
        detail.itemId === itemId
          ? { ...detail, details: detail.details.slice(0, newQuantity) }
          : detail
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setItemDetails([]);
    localStorage.removeItem('cartItems');
    localStorage.removeItem('itemDetails');
  };

  const openDetailModal = (item, type, isFromBooking = false) => {
    setSelectedItemForDetail(item);
    setDetailModalType(type);
    setIsDetailModalOpen(true);
    const description = item.description || '';
    const sentenceCount = description.split('.').filter((s) => s.trim()).length;
    let errorMsg = '';
    if (description.length > 3000) {
      errorMsg = 'Description exceeds 3000 characters';
    } else if (sentenceCount > 3) {
      errorMsg = 'Description exceeds 3 sentences';
    }
    setDetailModalDescriptionError(errorMsg);
    console.log(`Opening detail modal for ${type}:`, item.name || item.destination?.name, `From booking modal: ${isFromBooking}`);
  };

  const closeDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItemForDetail(null);
    setDetailModalType('');
    setDetailModalDescriptionError('');
  };

  const openItineraryModal = (item) => {
    setSelectedItemForItinerary(item);
    setIsItineraryModalOpen(true);
    console.log('Opening itinerary modal for:', item);
  };

  const closeItineraryModal = () => {
    setIsItineraryModalOpen(false);
    setSelectedItemForItinerary(null);
  };

  const openImageModal = (imageUrl) => {
    setSelectedImageForModal(imageUrl);
    setIsImageModalOpen(true);
    console.log('Opening image modal for:', imageUrl);
  };

  const closeImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageForModal('');
  };

  return {
    cartItems,
    setCartItems,
    itemDetails,
    setItemDetails,
    isCartModalOpen,
    openCartModal,
    closeCartModal,
    isCheckoutModalOpen,
    openCheckoutModal,
    closeCheckoutModal,
    isDetailModalOpen,
    selectedItemForDetail,
    detailModalType,
    detailModalDescriptionError,
    openDetailModal,
    closeDetailModal,
    isItineraryModalOpen,
    selectedItemForItinerary,
    openItineraryModal,
    closeItineraryModal,
    isImageModalOpen,
    selectedImageForModal,
    openImageModal,
    closeImageModal,
    activeCurrency,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    clearCart,
  };
};

export default useAppState;