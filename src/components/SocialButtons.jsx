import React, { useState } from 'react';
import { FaWhatsapp, FaLine, FaWeixin } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const SocialButtons = ({ whatsappUrl, lineUrl, wechatUrl }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const containerVariants = {
        hidden: {
            opacity: 0,
            transition: {
                staggerChildren: 0.1, // Jeda antar item saat menyembunyikan
                staggerDirection: -1, // Sembunyikan dari atas ke bawah
            },
        },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1, // Jeda antar item saat menampilkan
            },
        },
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="flex flex-col items-center space-y-4 mb-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="hidden" // Animasi saat menghilang
                    >
                        {/* Tombol WhatsApp */}
                        <motion.a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-green-500 text-white rounded-full shadow-lg"
                            variants={itemVariants}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="WhatsApp"
                        >
                            <FaWhatsapp className="text-xl" />
                        </motion.a>

                        {/* Tombol LINE */}
                        <motion.a
                            href={lineUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-blue-500 text-white rounded-full shadow-lg"
                            variants={itemVariants}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="LINE"
                        >
                            <FaLine className="text-xl" />
                        </motion.a>

                        {/* Tombol WeChat */}
                        <motion.a
                            href={wechatUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-4 bg-green-600 text-white rounded-full shadow-lg"
                            variants={itemVariants}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            title="WeChat"
                        >
                            <FaWeixin className="text-xl" />
                        </motion.a>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tombol Utama */}
            <motion.button
                onClick={toggleOpen}
                className={`relative bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-700`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
            >
                <span className="absolute text-3xl transition-opacity duration-300 transform" dangerouslySetInnerHTML={{ __html: isOpen ? '&#x2715;' : '&#x2b;' }} />
            </motion.button>
        </div>
    );
};

export default SocialButtons;