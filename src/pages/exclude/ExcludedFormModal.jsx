import React, { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BiX } from 'react-icons/bi';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const modalVariants = {
    hidden: { y: "-100vh", opacity: 0 },
    visible: { y: "0", opacity: 1, transition: { duration: 0.1, type: "spring", damping: 25, stiffness: 500 } },
    exit: { y: "100vh", opacity: 0 },
};

function ExcludedFormModal({
    isOpen, onClose, isEdit, currentItem, setCurrentItem, languages,
    BACKEND_URL, authToken, fetchExcludedItems, handleApiError
}) {
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            const handleEscape = (e) => {
                if (e.key === 'Escape') onClose();
            };
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const handleTranslationChange = useCallback((langId, field, value) => {
        setCurrentItem(prev => {
            const updatedTranslations = prev.translations.map(t =>
                t.language._id === langId ? { ...t, [field]: value } : t
            );
            // Fallback: Jika terjemahan belum ada, tambahkan
            if (!updatedTranslations.some(t => t.language._id === langId)) {
                updatedTranslations.push({ language: { _id: langId }, name: '', description: '', [field]: value });
            }
            return { ...prev, translations: updatedTranslations };
        });
    }, [setCurrentItem]);

    const validateForm = useCallback(() => {
        const errors = {};
        if (!currentItem.translations || currentItem.translations.length === 0) {
            errors.translations = 'At least one translation is required.';
        } else {
            currentItem.translations.forEach((t, index) => {
                if (!t.language || !t.language._id) errors[`translations[${index}].language`] = 'Language is required.';
                if (!t.name) errors[`translations[${index}].name`] = 'Name is required.';
            });
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    }, [currentItem]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        const payload = {
            translations: currentItem.translations.map(t => ({
                language: t.language._id,
                name: t.name,
                description: t.description
            }))
        };

        const endpoint = isEdit ? `${BACKEND_URL}/api/excluded/${currentItem._id}` : `${BACKEND_URL}/api/excluded`;
        const method = isEdit ? 'put' : 'post';

        try {
            await axios[method](endpoint, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${authToken}`,
                },
            });
            fetchExcludedItems();
            onClose();
        } catch (err) {
            handleApiError(err, `Failed to ${isEdit ? 'update' : 'create'} excluded item.`);
        }
    }, [BACKEND_URL, authToken, isEdit, currentItem, fetchExcludedItems, onClose, handleApiError, validateForm]);

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
                    className="relative bg-white rounded-lg p-6 w-full max-w-lg min-h-[400px] max-h-[90vh] overflow-y-auto shadow-xl"
                    variants={modalVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <button type="button" onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl transition-colors" aria-label="Close modal"><BiX /></button>
                    <h3 className="text-lg sm:text-xl font-semibold text-havanaBlue mb-4">{isEdit ? 'Edit Excluded Item' : 'Add Excluded Item'}</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">Translations</label>
                            {formErrors.translations && <p className="text-red-500 text-xs mt-1">{formErrors.translations}</p>}
                            <div className="max-h-48 overflow-y-auto border rounded-md p-2 custom-scrollbar">
                                {languages.map(lang => {
                                    const translation = currentItem.translations?.find(t => t.language._id === lang._id) || { name: '', description: '' };
                                    return (
                                        <div key={lang._id} className="border p-3 mb-2 rounded-md bg-gray-50">
                                            <h4 className="text-sm font-medium">{lang.name} ({lang.code})</h4>
                                            <div className="mt-2 grid grid-cols-1 gap-4">
                                                <div>
                                                    <label htmlFor={`itemName-${lang._id}`} className="block text-xs sm:text-sm font-medium text-gray-700">Name</label>
                                                    <input
                                                        type="text"
                                                        id={`itemName-${lang._id}`}
                                                        name="name"
                                                        value={translation.name}
                                                        onChange={(e) => handleTranslationChange(lang._id, 'name', e.target.value)}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                                                        required={lang.code === 'en'}
                                                    />
                                                </div>
                                                <div>
                                                    <label htmlFor={`itemDescription-${lang._id}`} className="block text-xs sm:text-sm font-medium text-gray-700">Description</label>
                                                    <textarea
                                                        id={`itemDescription-${lang._id}`}
                                                        name="description"
                                                        value={translation.description}
                                                        onChange={(e) => handleTranslationChange(lang._id, 'description', e.target.value)}
                                                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm text-sm sm:text-base focus:ring-havanaBlue focus:border-havanaBlue"
                                                        rows="2"
                                                    />
                                                </div>
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

export default ExcludedFormModal;