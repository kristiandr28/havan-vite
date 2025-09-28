import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FeatureIndicator = ({ featureSections }) => {
  const [activeSectionId, setActiveSectionId] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = '';
      const offset = window.innerHeight * 0.4;

      for (let i = 0; i < featureSections.length; i++) {
        const { id } = featureSections[i];
        const sectionElement = document.getElementById(id);

        if (sectionElement) {
          const rect = sectionElement.getBoundingClientRect();
          if (rect.top <= offset && rect.bottom >= offset) {
            currentActiveId = id;
            break;
          }
        }
      }

      if (!currentActiveId && featureSections.length > 0) {
        const firstSectionElement = document.getElementById(featureSections[0].id);
        if (firstSectionElement) {
          if (window.scrollY < firstSectionElement.offsetTop + firstSectionElement.offsetHeight * 0.2) {
            currentActiveId = featureSections[0].id;
          }
        }
      }

      if (currentActiveId !== activeSectionId) {
        setActiveSectionId(currentActiveId);
      }
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [featureSections, activeSectionId]);

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center">
      {featureSections.map((feature, index) => (
        <div key={feature.id} className="relative flex flex-col items-center">
          <a
            href={`#${feature.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(feature.id)?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="relative flex items-center group"
            title={`Go to ${feature.name}`}
          >
            {/* Dot */}
            <motion.span
              className={
                `w-3 h-3 rounded-full border
                 transition-all duration-300 ease-in-out
                 ${activeSectionId === feature.id
                  ? 'bg-havanaBlue border-havanaBlue scale-110 shadow'
                  : 'bg-gray-300 border-gray-300 group-hover:scale-110'}
                `
              }
              layout
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            ></motion.span>

            {/* Label saat aktif */}
            <AnimatePresence>
              {activeSectionId === feature.id && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="absolute right-5 text-xs bg-white px-2 py-1 rounded shadow text-havanaBlue font-medium whitespace-nowrap"
                >
                  {feature.name}
                </motion.span>
              )}
            </AnimatePresence>
          </a>

          {/* Connector line (kecuali di item terakhir) */}
          {index < featureSections.length - 1 && (
            <div className="h-6 border-l border-gray-300 opacity-60"></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default FeatureIndicator;
