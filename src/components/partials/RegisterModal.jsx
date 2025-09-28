import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BiUserPlus,
  BiX,
  BiLogoGoogle,
  BiLogoFacebook,
  BiShow,
  BiHide,
  BiCheckCircle,
  BiErrorCircle,
  BiInfoCircle,
} from 'react-icons/bi';
import { useTranslation } from 'react-i18next';

// =========================
// Framer Motion Variants
// =========================
import { modalVariants, contentVariants, childVariants } from './modalVariants';

/* =========================
  Helper: Validators
  ========================= */
const isValidEmail = (email) =>
  !!email &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// We use a function to get rules so it can use 't'
const getPasswordRules = (t) => [
  { test: (v) => v.length >= 6, label: t('registerModal.passwordRules.sixChars') },
  { test: (v) => /[A-Za-z]/.test(v), label: t('registerModal.passwordRules.oneLetter') },
  { test: (v) => /\d/.test(v), label: t('registerModal.passwordRules.oneNumber') },
];

function PasswordHints({ password = '', t }) {
  const passwordRules = useMemo(() => getPasswordRules(t), [t]);
  return (
    <ul className="mt-1 space-y-1 text-xs">
      {passwordRules.map((r, idx) => {
        const ok = r.test(password);
        return (
          <li key={idx} className={`flex items-center gap-2 ${ok ? 'text-green-600' : 'text-gray-500'}`}>
            {ok ? <BiCheckCircle /> : <BiInfoCircle />}
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

/* =========================
  Component
  ========================= */
function RegisterModal({
  isOpen,
  closeModal,
  handleLoginClick,
  handleGoogleRegister,
  handleFacebookRegister,
  apiBaseUrl = import.meta.env.VITE_API_URL,
}) {
  const { t } = useTranslation(); // 👈 Add this line

  // Form state
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // UI state
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Derived validations
  const emailOk = useMemo(() => isValidEmail(email), [email]);
  const passwordOk = useMemo(() => getPasswordRules(t).every((r) => r.test(password)), [password, t]);
  const confirmOk = useMemo(() => !!confirm && confirm === password, [confirm, password]);
  const usernameOk = useMemo(() => username.trim().length >= 3, [username]);

  const formOk = usernameOk && emailOk && passwordOk && confirmOk;

  const resetState = useCallback(() => {
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirm('');
    setError('');
    setSuccessMsg('');
    setShowPwd(false);
    setShowConfirm(false);
    setIsLoading(false);
  }, []);

  const onClose = useCallback(() => {
    resetState();
    closeModal?.();
  }, [closeModal, resetState]);

  useEffect(() => {
    // Clear success message when modal opens or closes
    if (isOpen) {
      setSuccessMsg('');
    }
  }, [isOpen]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!formOk) {
      setError(t('registerModal.formError'));
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`${apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username,
          email,
          password,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || t('registerModal.formError'));
      }

      setSuccessMsg(t('registerModal.successMessage'));
      setError('');
      setPassword('');
      setConfirm('');
    } catch (err) {
      setError(err.message || t('registerModal.formError'));
      setSuccessMsg('');
    } finally {
      setIsLoading(false);
    }
  };

  const onGoogle = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      await handleGoogleRegister?.();
    } catch (e) {
      setError(e?.message || t('registerModal.googleError'));
    } finally {
      setIsLoading(false);
    }
  };

  const onFacebook = async () => {
    if (isLoading) return;
    try {
      setIsLoading(true);
      await handleFacebookRegister?.();
    } catch (e) {
      setError(e?.message || t('registerModal.facebookError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999]"
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
          aria-labelledby="register-modal-title"
          aria-describedby="register-modal-desc"
        >
          <motion.div
            className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-[90vw] sm:max-w-md shadow-lg max-h-[80vh] overflow-y-auto"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <motion.div className="flex justify-between items-center mb-4" variants={childVariants}>
              <div className="flex items-center space-x-2">
                <BiUserPlus className="text-blue-600 text-xl" />
                <h3 id="register-modal-title" className="text-base sm:text-lg font-semibold text-gray-800">
                  {t('registerModal.title')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
                aria-label="Close register modal"
              >
                <BiX className="text-xl" />
              </button>
            </motion.div>

            <motion.p id="register-modal-desc" className="sr-only" variants={childVariants}>
              Register with your username, email, and password to create a new account.
            </motion.p>

            {/* Alerts */}
            {error && (
              <motion.div
                variants={childVariants}
                className="mb-3 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm flex items-start gap-2"
              >
                <BiErrorCircle className="mt-[2px] shrink-0" />
                <span role="alert">{error}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                variants={childVariants}
                className="mb-3 rounded-lg border border-green-200 bg-green-50 text-green-700 px-3 py-2 text-sm flex items-start gap-2"
              >
                <BiCheckCircle className="mt-[2px] shrink-0" />
                <span role="status">{successMsg}</span>
              </motion.div>
            )}

            {/* Form */}
            <motion.form onSubmit={onSubmit} className="space-y-4" variants={childVariants} noValidate>
              {/* Username */}
              <motion.div variants={childVariants}>
                <label className="block text-sm font-medium text-gray-700" htmlFor="reg-username">
                  {t('registerModal.usernameLabel')}
                </label>
                <input
                  id="reg-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`mt-1 block w-full px-4 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600
                    ${username.length ? (usernameOk ? 'border-gray-300' : 'border-red-300') : 'border-gray-300'}`}
                  required
                  placeholder={t('registerModal.usernamePlaceholder')}
                  aria-invalid={!!error && !usernameOk}
                />
                {!usernameOk && username.length > 0 && (
                  <p className="mt-1 text-xs text-red-600">{t('registerModal.usernameHint')}</p>
                )}
              </motion.div>

              {/* Email */}
              <motion.div variants={childVariants}>
                <label className="block text-sm font-medium text-gray-700" htmlFor="reg-email">
                  {t('registerModal.emailLabel')}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`mt-1 block w-full px-4 py-2 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600
                    ${email.length ? (emailOk ? 'border-gray-300' : 'border-red-300') : 'border-gray-300'}`}
                  required
                  placeholder={t('registerModal.emailPlaceholder')}
                  aria-invalid={!!error && !emailOk}
                />
                {email.length > 0 && !emailOk && (
                  <p className="mt-1 text-xs text-red-600">{t('registerModal.emailHint')}</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={childVariants}>
                <label className="block text-sm font-medium text-gray-700" htmlFor="reg-password">
                  {t('registerModal.passwordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`mt-1 block w-full px-4 py-2 pr-10 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600
                      ${password.length ? (passwordOk ? 'border-gray-300' : 'border-amber-300') : 'border-gray-300'}`}
                    required
                    placeholder={t('registerModal.passwordPlaceholder')}
                    aria-invalid={!!error && !passwordOk}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPwd ? <BiHide /> : <BiShow />}
                  </button>
                </div>
                <PasswordHints password={password} t={t} /> {/* 👈 Pass 't' as a prop */}
              </motion.div>

              {/* Confirm Password */}
              <motion.div variants={childVariants}>
                <label className="block text-sm font-medium text-gray-700" htmlFor="reg-confirm">
                  {t('registerModal.confirmPasswordLabel')}
                </label>
                <div className="relative">
                  <input
                    id="reg-confirm"
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className={`mt-1 block w-full px-4 py-2 pr-10 border rounded-full text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600
                      ${confirm.length ? (confirmOk ? 'border-gray-300' : 'border-red-300') : 'border-gray-300'}`}
                    required
                    placeholder={t('registerModal.confirmPasswordPlaceholder')}
                    aria-invalid={!!error && !confirmOk}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((s) => !s)}
                    className="absolute inset-y-0 right-3 flex items-center text-gray-600 hover:text-gray-800"
                    aria-label={showConfirm ? 'Hide confirmation password' : 'Show confirmation password'}
                    tabIndex={-1}
                  >
                    {showConfirm ? <BiHide /> : <BiShow />}
                  </button>
                </div>
                {confirm.length > 0 && !confirmOk && (
                  <p className="mt-1 text-xs text-red-600">{t('registerModal.passwordMismatch')}</p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-full hover:bg-blue-700 transition-colors duration-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                variants={childVariants}
                disabled={isLoading || !formOk}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-white mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t('registerModal.creatingAccount')}
                  </span>
                ) : (
                  t('registerModal.submitButton')
                )}
              </motion.button>
            </motion.form>

            {/* Divider */}
            <motion.div className="my-4 flex items-center" variants={childVariants}>
              <div className="h-px bg-gray-200 flex-1" />
              <span className="mx-3 text-xs uppercase tracking-wide text-gray-500">{t('registerModal.orDivider')}</span>
              <div className="h-px bg-gray-200 flex-1" />
            </motion.div>

            {/* Social buttons */}
            <motion.div className="space-y-2" variants={childVariants}>
              <motion.button
                onClick={onGoogle}
                className="w-full bg-white border border-gray-300 text-gray-700 rounded-full py-2 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                disabled={isLoading || !handleGoogleRegister}
                title={!handleGoogleRegister ? 'Google sign-up not configured' : 'Sign up with Google'}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-gray-700 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t('registerModal.creatingAccount')}
                  </span>
                ) : (
                  <>
                    <BiLogoGoogle className="text-lg" />
                    {t('registerModal.googleButton')}
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={onFacebook}
                className="w-full bg-white border border-gray-300 text-gray-700 rounded-full py-2 px-4 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60"
                disabled={isLoading || !handleFacebookRegister}
                title={!handleFacebookRegister ? 'Facebook sign-up not configured' : 'Sign up with Facebook'}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 text-gray-700 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    {t('registerModal.creatingAccount')}
                  </span>
                ) : (
                  <>
                    <BiLogoFacebook className="text-blue-600 text-lg" />
                    {t('registerModal.facebookButton')}
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* Switch to Login */}
            <motion.p className="mt-4 text-center text-sm text-gray-600" variants={childVariants}>
              {t('registerModal.alreadyHaveAccount')}{' '}
              <button
                onClick={handleLoginClick}
                className="text-blue-600 hover:underline font-medium"
              >
                {t('registerModal.loginButton')}
              </button>
            </motion.p>

            {/* Post-success extra hint */}
            {successMsg && (
              <motion.div variants={childVariants} className="mt-3 text-xs text-gray-600">
                {t('registerModal.emailHintPost')}
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RegisterModal;
