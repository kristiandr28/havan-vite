import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { BiStar } from 'react-icons/bi';

function Reviews({ BACKEND_URL }) {
  const [allReviews, setAllReviews] = useState([]);
  const [error, setError] = useState('');

  // Fetch all reviews on mount
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/api/reviews`);
        const validReviews = response.data.filter(
          (review) =>
            review.userName &&
            review.rating >= 1 &&
            review.rating <= 5 &&
            review.comment &&
            review.comment.length <= 500
        );
        setAllReviews(validReviews.slice(0, 30)); // Ambil 30 review
        if (validReviews.length === 0) {
          setError('No reviews available');
        }
      } catch (err) {
        setError(err.response?.data.message || 'Failed to fetch reviews');
        console.error('Fetch reviews error:', err);
      }
    };
    fetchReviews();
  }, [BACKEND_URL]);

  // Bagi review: 15 atas, 15 bawah
  const topReviews = allReviews.slice(0, 15);
  const bottomReviews = allReviews.slice(15, 30);

  // Varian animasi marquee
  const marqueeVariants = {
    topRow: {
      animate: {
        x: ['0%', '-100%'], // Kanan ke kiri
        transition: {
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 30, // 30 detik untuk 15 kartu
            ease: 'linear'
          }
        }
      }
    },
    bottomRow: {
      animate: {
        x: ['-100%', '0%'], // Kiri ke kanan
        transition: {
          x: {
            repeat: Infinity,
            repeatType: 'loop',
            duration: 30, // 30 detik untuk 15 kartu
            ease: 'linear'
          }
        }
      }
    }
  };

  return (
    <section className="mb-12">
      <h2 className="text-2xl sm:text-3xl font-bold text-havanaGray mb-6 text-center">Customer Reviews</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      <div className="space-y-4">
        {/* Baris Atas (Kanan ke Kiri) */}
        <div className="overflow-hidden">
          <motion.div
            className="flex flex-row gap-4"
            variants={marqueeVariants.topRow}
            animate="animate"
          >
            {/* Duplikat kartu untuk animasi mulus */}
            {[...topReviews, ...topReviews].map((review, index) => (
              <div
                key={`${review._id}-${index}`}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300 flex-shrink-0 w-[200px]"
              >
                <div className="flex items-center mb-2">
                  <h3 className="text-base font-semibold text-havanaGray truncate">{review.userName}</h3>
                  <div className="ml-2 flex">
                    {[...Array(5)].map((_, i) => (
                      <BiStar
                        key={i}
                        className={i < review.rating ? 'text-havanaPink' : 'text-gray-300'}
                        size={18}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-700 line-clamp-3">{review.comment}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Baris Bawah (Kiri ke Kanan) */}
        <div className="overflow-hidden">
          <motion.div
            className="flex flex-row gap-4"
            variants={marqueeVariants.bottomRow}
            animate="animate"
          >
            {/* Duplikat kartu untuk animasi mulus */}
            {[...bottomReviews, ...bottomReviews].map((review, index) => (
              <div
                key={`${review._id}-${index}`}
                className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow duration-300 flex-shrink-0 w-[200px]"
              >
                <div className="flex items-center mb-2">
                  <h3 className="text-base font-semibold text-havanaGray truncate">{review.userName}</h3>
                  <div className="ml-2 flex">
                    {[...Array(5)].map((_, i) => (
                      <BiStar
                        key={i}
                        className={i < review.rating ? 'text-havanaPink' : 'text-gray-300'}
                        size={18}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {new Date(review.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-xs text-gray-700 line-clamp-3">{review.comment}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default Reviews;