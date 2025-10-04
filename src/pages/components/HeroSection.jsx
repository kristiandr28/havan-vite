import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BiChevronLeft, BiChevronRight, BiChevronDown } from "react-icons/bi";

const slideVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

function HeroSection({
  heroes,
  currentHero,
  isPaused,
  setIsPaused,
  goToNext,
  goToPrev,
  goToHero,
  BACKEND_URL,
}) {
  return (
    <div
      className="relative w-full min-h-screen overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {heroes.length > 0 ? (
        <div className="absolute inset-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentHero}
              className="absolute inset-0"
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <img
                src={`${BACKEND_URL}${heroes[currentHero].image}`}
                alt={heroes[currentHero].title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src =
                    "https://www.shorekids.co.nz/wp-content/uploads/2014/08/image-placeholder.jpg";
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/80 backdrop-blur-sm flex items-center justify-center px-4 text-center">
                <div className="max-w-4xl text-white">
                  <motion.h1
                    className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    {heroes[currentHero].title}
                  </motion.h1>
                  <motion.p
                    className="text-lg sm:text-xl mb-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                  >
                    {heroes[currentHero].subtitle}
                  </motion.p>
                  <motion.a
                    href={heroes[currentHero].buttonLink}
                    className="inline-block bg-havanaPink text-white py-3 px-6 rounded-md text-base sm:text-lg shadow-lg hover:scale-105 hover:shadow-pink-500/40 transition-all duration-300"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    {heroes[currentHero].buttonText}
                  </motion.a>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigasi kiri-kanan */}
          {heroes.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70"
                aria-label="Previous slide"
              >
                <BiChevronLeft className="text-3xl" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-40 text-white p-2 rounded-full hover:bg-opacity-70"
                aria-label="Next slide"
              >
                <BiChevronRight className="text-3xl" />
              </button>

              {/* Dot navigasi */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                {heroes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToHero(index)}
                    className={`w-2.5 h-2.5 rounded-full ${
                      index === currentHero ? "bg-havanaPink" : "bg-white/40"
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Scroll Indicator */}
          <motion.div
            className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-3xl animate-bounce"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
          >
            <a href="#next-section" aria-label="Scroll down">
              <BiChevronDown />
            </a>
          </motion.div>
        </div>
      ) : (
        // ✅ Fallback jika tidak ada data heroes
        <div
          className="relative w-full min-h-screen flex items-center justify-center px-4 text-center text-white"
          style={{
            backgroundImage: `url('/public/images/hero-backend.jpg')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Overlay gelap agar teks tetap terbaca */}
          <div className="absolute inset-0 bg-black/60"></div>

          {/* Konten fallback */}
          <div className="relative max-w-4xl z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
              Discover Your Next Adventure
            </h1>
            <p className="text-lg sm:text-xl mb-6">
              Explore breathtaking destinations with Havana Travel
            </p>
            <a
              href="/tours"
              className="inline-block bg-havanaPink text-white py-3 px-6 rounded-md hover:bg-pink-700 text-base sm:text-lg transition-all duration-300"
            >
              Explore Tours
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default HeroSection;
