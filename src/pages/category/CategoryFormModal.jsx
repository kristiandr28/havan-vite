import React, { useState, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BiX } from 'react-icons/bi';
import axios from 'axios';

const modalVariants = {
    hidden: { y: "-100vh", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 } },
    exit: { y: "100vh", opacity: 0 },
};

function CategoryFormModal({
    isOpen, onClose, isEdit, currentCategory, setCurrentCategory, languages,
    BACKEND_URL, authToken, fetchCategories, handleApiError
}) {
    const [formErrors, setFormErrors] = useState({});

    // Efek untuk menutup modal dengan tombol Escape
    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    // Handle perubahan input untuk terjemahan (hanya untuk field 'name')
    const handleTranslationChange = useCallback((langId, value) => {
        setCurrentCategory(prev => {
            const updatedTranslations = prev.translations.map(t =>
                // Gunakan t.language._id jika objek language sudah ter-populate
                (t.language._id === langId || t.language === langId) ? { ...t, name: value } : t
            );
            
            // Fallback: Jika terjemahan belum ada (kasus 'Add'), tambahkan
            if (!updatedTranslations.some(t => (t.language._id === langId || t.language === langId))) {
                updatedTranslations.push({ language: langId, name: value });
            }
            return { ...prev, translations: updatedTranslations };
        });
        setFormErrors({}); // Clear errors on change
    }, [setCurrentCategory]);

    // Validasi Formulir
    const validateForm = useCallback(() => {
        const errors = {};
        const translationsWithNames = currentCategory.translations.filter(t => t.name && t.name.trim() !== '');

        // Persyaratan: Minimal satu terjemahan harus diisi
        if (translationsWithNames.length === 0) {
            errors.translations = 'At least one category name translation is required.';
        } else {
            // Opsional: Jika Anda ingin memvalidasi bahwa bahasa default (misal EN) HARUS diisi
            // const englishLang = languages.find(l => l.code === 'en');
            // const englishTranslation = currentCategory.translations.find(t => (t.language._id === englishLang?._id || t.language === englishLang?._id));
            // if (englishLang && (!englishTranslation || !englishTranslation.name.trim())) {
            //     errors.en_name = `Name in English (${englishLang.code.toUpperCase()}) is required.`;
            // }
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentCategory, languages]);

    // Submit Formulir
    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        // Filter terjemahan yang namanya kosong sebelum mengirim ke backend
        const translationsToSend = currentCategory.translations
            .map(t => ({
                language: t.language._id || t.language, // Pastikan hanya mengirim ID bahasa
                name: t.name ? t.name.trim() : ''
            }))
            .filter(t => t.name !== ''); // Hanya kirim yang memiliki nama

        const payload = {
            translations: translationsToSend
        };

        const endpoint = isEdit ? `${BACKEND_URL}/api/categories/${currentCategory._id}` : `${BACKEND_URL}/api/categories`;
        const method = isEdit ? 'put' : 'post';

        try {
            await axios[method](endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });
            fetchCategories(); // Refresh data di komponen induk
            onClose(); // Tutup modal
        } catch (err) {
            handleApiError(err, `Failed to ${isEdit ? 'update' : 'create'} category.`);
        }
    }, [BACKEND_URL, authToken, isEdit, currentCategory, fetchCategories, onClose, handleApiError, validateForm]);

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="relative bg-white rounded-lg p-6 w-full max-w-lg min-h-[300px] max-h-[90vh] overflow-y-auto shadow-xl"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <button type="button" onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl transition-colors" aria-label="Close modal"><BiX /></button>
                    <h3 className="text-lg sm:text-xl font-semibold text-havanaBlue mb-4">{isEdit ? 'Edit Category (Multilingual)' : 'Add Category (Multilingual)'}</h3>
                    
                    {formErrors.translations && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                            <strong className="font-bold">Validation Error!</strong>
                            <span className="block sm:inline"> {formErrors.translations}</span>
                        </div>
                    )}
                    {formErrors.en_name && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 text-sm" role="alert">
                            <span className="block sm:inline"> {formErrors.en_name}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Category Names (Translations)</label>
                            
                            <div className="max-h-64 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                                {languages.map(lang => {
                                    // Cari terjemahan yang sudah ada. T.language bisa berupa string ID atau objek populasi.
                                    const translation = currentCategory.translations?.find(t => (t.language._id === lang._id || t.language === lang._id)) || { name: '' };
                                    
                                    // Tentukan apakah ini bahasa default (misal EN)
                                    const isDefaultLang = lang.code === 'en';

                                    return (
                                        <div key={lang._id} className="border p-3 mb-2 rounded-md bg-gray-50">
                                            <h4 className="text-sm font-medium">
                                                {lang.name} ({lang.code})
                                                {isDefaultLang && <span className="ml-2 text-xs text-blue-600">(Default)</span>}
                                            </h4>
                                            <div className="mt-2 grid grid-cols-1 gap-4">
                                                <div>
                                                    <label htmlFor={`categoryName-${lang._id}`} className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                                                    <input
                                                        type="text"
                                                        id={`categoryName-${lang._id}`}
                                                        name="name"
                                                        value={translation.name}
                                                        onChange={(e) => handleTranslationChange(lang._id, e.target.value)}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                                                        // Tidak menggunakan 'required' di HTML karena validasi multibahasa di handle submit
                                                    />
                                                </div>
                                                {/* Bidang 'Description' dihapus karena kategori biasanya hanya memiliki nama */}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-1.5 px-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm sm:text-base transition"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="py-1.5 px-3 bg-havanaBlue text-white rounded-md hover:bg-blue-700 text-sm sm:text-base transition"
                            >
                                {isEdit ? 'Update' : 'Create'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
}

export default CategoryFormModal;