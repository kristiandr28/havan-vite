import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  BiLogIn,
  BiX,
  BiLogoGoogle,
  BiLogoFacebook,
} from "react-icons/bi";
import { useTranslation } from 'react-i18next'; // 👈 Import useTranslation
import {
  modalVariants,
  contentVariants,
  childVariants,
} from "./modalVariants";

function LoginModal({
  isOpen,
  closeModal,
  handleLoginSubmit,
  handleGoogleLogin,
  handleFacebookLogin,
  handleRegisterClick,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  isLoading = false,
}) {
  const navigate = useNavigate();

  // 👈 Use the hook to get the translation function 't'
  const { t } = useTranslation(); 

  // Submit login form
  const onSubmit = async (e) => {
    console.log("LoginModal: Submit triggered", {
      loginEmail,
      loginPassword,
    });
    await handleLoginSubmit(e);
  };

  // Tutup modal + redirect ke forgot password
  const handleForgotPasswordClick = () => {
    if (closeModal) closeModal();
    navigate("/forgot-password");
  };

  useEffect(() => {
    if (isOpen) {
      console.log("LoginModal: Rendered with z-index 10001");
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-[10001]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeModal}
          key="modal-overlay"
        >
          <motion.div
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md shadow-lg max-h-[80vh] overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
            key="modal-content"
          >
            {/* Header */}
            <motion.div
              className="flex justify-between items-center mb-4"
              variants={childVariants}
            >
              <div className="flex items-center space-x-2">
                <BiLogIn className="text-blue-600 text-xl" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                  {/* 👈 Use t() for the heading */}
                  {t('loginModal.title')}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close login modal"
              >
                <BiX className="text-xl" />
              </button>
            </motion.div>

            {/* Error Message */}
            {loginError && (
              <motion.p
                className="text-red-500 mb-4 text-sm"
                variants={childVariants}
              >
                {loginError}
              </motion.p>
            )}

            {/* Form */}
            <motion.form
              onSubmit={onSubmit}
              className="space-y-4"
              variants={childVariants}
            >
              {/* Email */}
              <motion.div variants={childVariants}>
                <label className="block text-sm font-medium text-gray-700">
                  {/* 👈 Use t() for the label */}
                  {t('loginModal.emailLabel')}
                </label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                  placeholder={t('loginModal.emailPlaceholder')}
                  aria-invalid={loginError ? "true" : "false"}
                />
              </motion.div>

              {/* Password */}
              <motion.div variants={childVariants}>
                <label className="block text-sm font-medium text-gray-700">
                  {/* 👈 Use t() for the label */}
                  {t('loginModal.passwordLabel')}
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  required
                  placeholder={t('loginModal.passwordPlaceholder')}
                  aria-invalid={loginError ? "true" : "false"}
                />
                <div className="text-right mt-1">
                  <button
                    type="button"
                    onClick={handleForgotPasswordClick}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    {/* 👈 Use t() for the link text */}
                    {t('loginModal.forgotPassword')}
                  </button>
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                variants={childVariants}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      />
                    </svg>
                    {/* 👈 Use t() for loading message */}
                    {t('loginModal.loading')}
                  </span>
                ) : (
                  // 👈 Use t() for the button text
                  t('loginModal.loginButton')
                )}
              </motion.button>
            </motion.form>

            {/* Google Button */}
            <motion.button
              onClick={handleGoogleLogin}
              className="w-full mt-4 bg-white border border-gray-300 text-gray-700 rounded-full py-2 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              variants={childVariants}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-700 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  {/* 👈 Use t() for loading message */}
                  {t('loginModal.loading')}
                </span>
              ) : (
                <>
                  <BiLogoGoogle className="text-lg" />
                  {/* 👈 Use t() for the button text */}
                  {t('loginModal.loginWithGoogle')}
                </>
              )}
            </motion.button>

            {/* Facebook Button */}
            <motion.button
              onClick={handleFacebookLogin}
              className="w-full mt-2 bg-white border border-gray-300 text-gray-700 rounded-full py-2 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              variants={childVariants}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-gray-700 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>
                  {/* 👈 Use t() for loading message */}
                  {t('loginModal.loading')}
                </span>
              ) : (
                <>
                  <BiLogoFacebook className="text-blue-600 text-lg" />
                  {/* 👈 Use t() for the button text */}
                  {t('loginModal.loginWithFacebook')}
                </>
              )}
            </motion.button>

            {/* Register Link */}
            <motion.p
              className="mt-4 text-center text-sm text-gray-600"
              variants={childVariants}
            >
              {/* 👈 Use t() to combine the parts of the sentence */}
              {t('loginModal.noAccount')}{" "}
              <button
                onClick={handleRegisterClick}
                className="text-blue-600 hover:underline font-medium"
              >
                {/* 👈 Use t() for the button text */}
                {t('loginModal.registerButton')}
              </button>
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;