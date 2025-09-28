import React from 'react';
import { useTranslation } from 'react-i18next'; // <-- Tambahkan ini
import { motion } from 'framer-motion';

function AboutUsSection({ openWhyChooseHavanaModal, openCustomizationModal }) {
  const { t } = useTranslation(); // <-- Tambahkan ini

  const sectionVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="mb-12"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Right Column (sekarang ditaruh di kiri): Large Box */}
        <motion.div
          className="md:col-span-2 bg-gray-50 p-6 rounded-lg shadow-md order-1 md:order-2"
          variants={itemVariants}
        >
          <motion.h2
            className="text-3xl font-bold text-havanaGray text-center mb-6"
            variants={itemVariants}
          >
            {t('aboutUs.heading')}
          </motion.h2>
          <motion.p
            className="text-lg text-gray-700 mb-4 leading-relaxed"
            variants={itemVariants}
          >
            {t('aboutUs.paragraph1')}
          </motion.p>
          <motion.p
            className="text-lg text-gray-700 mb-4 leading-relaxed"
            variants={itemVariants}
          >
            {t('aboutUs.paragraph2')}
          </motion.p>
          <motion.p
            className="text-lg text-gray-700 mb-4 leading-relaxed"
            variants={itemVariants}
          >
            {t('aboutUs.paragraph3')}
          </motion.p>
          <motion.p
            className="text-lg text-havanaBlue font-semibold text-center mt-6"
            variants={itemVariants}
          >
            {t('aboutUs.slogan')}
          </motion.p>
        </motion.div>

        {/* Left Column (sekarang ditaruh di kanan): Two Small Boxes */}
        <div className="md:col-span-1 flex flex-col h-full gap-6 order-2 md:order-1">
          {/* Why Choose Havana Box */}
          <motion.div
            className="relative bg-cover bg-center p-6 rounded-lg shadow-md flex items-center justify-center flex-1"
            style={{ backgroundImage: "url('/images/why-choose-havana-image1.jpg')" }}
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-black/50 rounded-lg z-0"></div>
            <button
              onClick={openWhyChooseHavanaModal}
              className="relative z-10 text-white font-semibold text-lg text-center w-full hover:text-pink-200 transition-colors duration-300"
            >
              {t('aboutUs.whyChoose')}
            </button>
          </motion.div>

          {/* Customization Box */}
          <motion.div
            className="relative bg-cover bg-center p-6 rounded-lg shadow-md flex items-center justify-center flex-1"
            style={{ backgroundImage: "url('/images/customization-image1.jpg')" }}
            variants={itemVariants}
          >
            <div className="absolute inset-0 bg-black/50 rounded-lg z-0"></div>
            <button
              onClick={openCustomizationModal}
              className="relative z-10 text-white font-semibold text-lg text-center w-full hover:text-blue-200 transition-colors duration-300"
            >
              {t('aboutUs.customization')}
            </button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

export default AboutUsSection;