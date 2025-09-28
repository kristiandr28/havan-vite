import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import ReactCountryFlag from "react-country-flag";

const LanguageSelector = () => {
  // Panggil useTranslation untuk mendapatkan t (fungsi terjemahan) dan i18n
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  // === PERUBAHAN UTAMA DI SINI: MENAMBAHKAN SEMUA 7 BAHASA ===
  const languages = [
    { code: "id", countryCode: "ID", label: "Indonesian" },
    { code: "en", countryCode: "US", label: "English" },
    { code: "fr", countryCode: "FR", label: "French" },
    { code: "zh", countryCode: "CN", label: "Mandarin" }, // Menggunakan CN untuk China (Mandarin)
    { code: "ja", countryCode: "JP", label: "Japanese" },
    { code: "ko", countryCode: "KR", label: "Korean" },
    { code: "ru", countryCode: "RU", label: "Russian" },
  ];
  // ==========================================================

  const currentLang = languages.find((l) => l.code === i18n.language) || languages[0];

  const containerVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      transition: { staggerChildren: 0.05, staggerDirection: -1 },
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20,
        delayChildren: 0.1,
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 left-6 z-[100] flex flex-col items-start">
      {/* Dropdown Bahasa */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="flex flex-col items-end space-y-2 mb-4 p-2 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            {languages
              .filter((l) => l.code !== currentLang.code)
              .map((lang) => (
                <motion.button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className="flex items-center space-x-3 w-full px-4 py-2 rounded-lg transition-colors duration-200 hover:bg-gray-100"
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <ReactCountryFlag
                    countryCode={lang.countryCode}
                    svg
                    style={{ width: "2em", height: "1.5em" }}
                    className="rounded-md"
                    title={lang.label}
                  />
                  <span className="text-sm font-medium text-gray-800">{lang.label}</span>
                </motion.button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol Utama dengan Tooltip */}
      <div className="relative group">
        <motion.button
          onClick={toggleOpen}
          className="relative w-14 h-14 flex items-center justify-center rounded-full shadow-lg overflow-hidden transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ rotate: isOpen ? 180 : 0 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLang.code}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <ReactCountryFlag
                countryCode={currentLang.countryCode}
                svg
                style={{ width: "100%", height: "100%" }}
                className="rounded-full"
                title={currentLang.label}
              />
            </motion.div>
          </AnimatePresence>
        </motion.button>

        {/* Tooltip yang diterjemahkan */}
        <span className="absolute left-full top-1/2 ml-4 -translate-y-1/2 transform whitespace-nowrap rounded-md bg-gray-800 px-3 py-1 text-sm font-medium text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 pointer-events-none">
          {t('selectLanguage')}
        </span>
      </div>
    </div>
  );
};

export default LanguageSelector;