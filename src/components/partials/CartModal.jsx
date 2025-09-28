import React from "react";
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next'; // <-- Tambahkan ini
import { BiShoppingBag, BiX, BiTrash } from 'react-icons/bi';
import { modalVariants, contentVariants, childVariants } from './modalVariants';

function CartModal({
  isOpen,
  closeModal,
  cartItems,
  removeFromCart,
  updateCartItemQuantity,
  activeCurrency,
  openCheckoutModal,
  isAuthenticated,
  handleLogin,
}) {
  const { t } = useTranslation(); // <-- Tambahkan ini

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getPricingUnit = (item) => {
    if (item.modalType === 'tour') {
      return t('cartModal.perPackage', { maxPax: item.maxPax || 'N/A' });
    } else if (item.modalType === 'activity') {
      return t('cartModal.perPerson');
    } else if (item.modalType === 'ticket') {
      return t('cartModal.forOneTicket');
    }
    return t('cartModal.perUnit');
  };

  const handleCheckoutClick = () => {
    if (isAuthenticated) {
      openCheckoutModal();
    } else {
      handleLogin();
    }
  };

  const handleQuantityChange = (itemId, value) => {
    const newQuantity = Math.min(Math.max(parseInt(value) || 1, 1), 5);
    console.log(`CartModal: Updating quantity for item ${itemId} to ${newQuantity}`);
    updateCartItemQuantity(itemId, newQuantity);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
          key="cart-modal-overlay"
        >
          <motion.div
            className="max-h-[80vh] w-full max-w-[90vw] overflow-y-auto rounded-xl bg-white p-4 shadow-lg sm:max-w-xl sm:p-6"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            key="cart-modal-content"
          >
            {/* Modal Header */}
            <motion.div
              className="mb-4 flex items-center justify-between"
              variants={childVariants}
            >
              <div className="flex items-center space-x-2">
                <BiShoppingBag className="text-xl text-havanaBlue" />
                <h3 className="text-base font-semibold text-havanaGray sm:text-lg">{t('cartModal.yourCart')}</h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800"
                aria-label={t('ariaLabels.closeCartModal')}
              >
                <BiX className="text-xl" />
              </button>
            </motion.div>

            {/* Cart Items List or Empty Message */}
            {cartItems.length === 0 ? (
              <motion.p className="py-8 text-center text-gray-600" variants={childVariants}>
                {t('cartModal.cartEmpty')}
              </motion.p>
            ) : (
              <motion.div variants={childVariants}>
                {cartItems.map((item, index) => (
                  <motion.div
                    key={`${item._id}-${index}`}
                    className="flex items-center justify-between border-b border-gray-200 py-3"
                    variants={childVariants}
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-havanaGray">
                        {item.destination?.name || item.name || t('cartModal.unknownItem')}
                      </h4>
                      <p className="text-xs text-gray-500">
                        {activeCurrency.code} {item.price.toLocaleString()} {getPricingUnit(item)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        max="5"
                        value={item.quantity}
                        onChange={(e) => handleQuantityChange(item._id, e.target.value)}
                        className="w-16 rounded-md border py-1 text-center text-sm"
                        aria-label={t('ariaLabels.itemQuantity', {
                          item: item.destination?.name || item.name || t('cartModal.unknownItem'),
                        })}
                      />
                      <button
                        onClick={() => removeFromCart(item._id)}
                        className="text-red-500 hover:text-red-700"
                        aria-label={t('ariaLabels.removeItem', {
                          item: item.destination?.name || item.name || t('cartModal.unknownItem'),
                        })}
                      >
                        <BiTrash className="text-lg" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {/* Cart Total */}
                <div className="mt-4 flex items-center justify-between pt-4 text-base font-semibold sm:text-lg">
                  <span>{t('cartModal.total')}</span>
                  <span>{activeCurrency.code} {calculateTotal().toLocaleString()}</span>
                </div>

                {/* Login Message */}
                {!isAuthenticated && (
                  <p className="mt-2 text-right text-sm text-gray-500">
                    {t('cartModal.loginMessage')}
                  </p>
                )}

                {/* Checkout Button */}
                <div className="mt-6 text-right">
                  <button
                    onClick={handleCheckoutClick}
                    className={`rounded-md bg-havanaPink px-5 py-2 font-semibold text-white transition-colors duration-200 sm:text-sm ${
                      cartItems.length === 0 ? 'cursor-not-allowed opacity-50' : 'hover:bg-havanaPink-dark'
                    }`}
                    disabled={cartItems.length === 0}
                  >
                    {isAuthenticated ? t('cartModal.proceedToCheckout') : t('cartModal.loginToCheckout')}
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default CartModal;