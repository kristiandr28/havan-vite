import React, { useState } from 'react';
import { FaWhatsapp, FaLine, FaWeixin } from 'react-icons/fa';
import { motion } from 'framer-motion';

const SocialButtons = ({ whatsappUrl, lineUrl, wechatUrl }) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOpen = () => setIsOpen(!isOpen);

    const buttonVariants = {
        hidden: { scale: 0, opacity: 0 },
        visible: { scale: 1, opacity: 1 },
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            {/* Tombol WhatsApp */}
            <motion.a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-0 right-0 p-4 bg-green-500 text-white rounded-full shadow-lg"
                variants={buttonVariants}
                initial="hidden"
                animate={isOpen ? 'visible' : 'hidden'}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <FaWhatsapp className="text-xl" />
            </motion.a>

            {/* Tombol LINE */}
            <motion.a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-0 right-0 p-4 bg-blue-500 text-white rounded-full shadow-lg"
                variants={buttonVariants}
                initial="hidden"
                animate={isOpen ? 'visible' : 'hidden'}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <FaLine className="text-xl" />
            </motion.a>

            {/* Tombol WeChat */}
            <motion.a
                href={wechatUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-0 right-0 p-4 bg-green-600 text-white rounded-full shadow-lg"
                variants={buttonVariants}
                initial="hidden"
                animate={isOpen ? 'visible' : 'hidden'}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                <FaWeixin className="text-xl" />
            </motion.a>

            {/* Tombol Utama */}
            <motion.button
                onClick={toggleOpen}
                className={`relative bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg hover:bg-blue-700 z-50`}
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