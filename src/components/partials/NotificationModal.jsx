import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BiX, BiLoaderAlt } from 'react-icons/bi';
import axios from 'axios';

// Pastikan path ke modalVariants benar
import { modalVariants } from './modalVariants';

function NotificationModal({ isOpen, closeModal, user, token, BACKEND_URL, onModalOpen }) {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user || !token) {
                setError('Pengguna tidak terautentikasi.');
                return;
            }

            setLoading(true);
            setError('');
            try {
                const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                // Urutkan notifikasi berdasarkan 'createdAt' dari yang terbaru
                setNotifications(response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            } catch (err) {
                console.error('Gagal mengambil notifikasi:', err);
                setError('Gagal memuat notifikasi. Silakan coba lagi.');
                setNotifications([]);
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchNotifications();
            if (onModalOpen) {
                onModalOpen();
            }
        } else {
            setNotifications([]);
            setLoading(false);
            setError('');
        }
    }, [isOpen, user, token, BACKEND_URL, onModalOpen]);


    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeModal}
                >
                    <motion.div
                        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={closeModal}
                            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                            aria-label="Close notifications modal"
                        >
                            <BiX className="text-2xl" />
                        </button>
                        <h3 className="text-xl font-semibold text-havanaBlue mb-4">Notifikasi Anda</h3>

                        <div className="space-y-4 max-h-96 overflow-y-auto">
                            {loading ? (
                                <p className="text-gray-700 flex items-center justify-center">
                                    <BiLoaderAlt className="animate-spin mr-2" /> Memuat notifikasi...
                                </p>
                            ) : error ? (
                                <p className="text-red-500 text-center">{error}</p>
                            ) : notifications.length > 0 ? (
                                notifications.map((notif) => (
                                    <div key={notif._id} className="border-b pb-2 last:border-b-0">
                                        <p className="font-medium text-gray-800">{notif.title || 'Notifikasi Baru'}</p>
                                        <p className="text-sm text-gray-600">{notif.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {/* Perubahan di sini: notif.timestamp menjadi notif.createdAt */}
                                            {new Date(notif.createdAt).toLocaleString('id-ID', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-700 text-center">Tidak ada notifikasi baru saat ini.</p>
                            )}
                        </div>

                        <div className="mt-6 text-center">
                            <button
                                onClick={closeModal}
                                className="py-2 px-4 bg-havanaBlue text-white rounded-md hover:bg-havanaDarkBlue transition"
                            >
                                Tutup
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

export default NotificationModal;