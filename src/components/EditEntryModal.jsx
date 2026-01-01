import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Folder, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const EditEntryModal = ({ isOpen, onClose, entry, folders, onSave }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [selectedFolderId, setSelectedFolderId] = useState('');
    const [date, setDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (entry) {
            setTitle(entry.title || '');
            setTitle(entry.title || '');
            setContent(entry.content || '');
            setSelectedFolderId(entry.folderId || '');
            // Handle date: check if it has toDate() (from service) or is a string/date object
            let d = new Date();
            if (entry.date) {
                if (typeof entry.date.toDate === 'function') {
                    d = entry.date.toDate();
                } else {
                    d = new Date(entry.date);
                }
            }
            setDate(format(d, 'yyyy-MM-dd'));
        }
    }, [entry]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            let finalDate = new Date();
            // Try to preserve original time
            if (entry.date) {
                const originalDate = typeof entry.date.toDate === 'function' ? entry.date.toDate() : new Date(entry.date);
                // Check if originalDate is valid
                if (!isNaN(originalDate.getTime())) {
                    finalDate = new Date(originalDate);
                }
            }

            // Apply new YMD from picker
            if (date) {
                const [y, m, d] = date.split('-').map(Number);
                finalDate.setFullYear(y);
                finalDate.setMonth(m - 1);
                finalDate.setDate(d);
            }

            await onSave(entry.id, {
                title,
                content,
                folderId: selectedFolderId === '' ? null : selectedFolderId,
                date: finalDate.toISOString()
            });
            onClose();
        } catch (error) {
            console.error("Failed to save", error);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    <div className="p-6 border-b border-neutral-100 dark:border-slate-700 flex justify-between items-center">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">Edit Entry</h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors text-neutral-500 dark:text-slate-400"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
                        {/* Title */}
                        <div>
                            <input
                                type="text"
                                placeholder="Entry Title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="w-full text-2xl font-bold placeholder-neutral-300 dark:placeholder-slate-600 border-none focus:ring-0 p-0 text-neutral-800 dark:text-white bg-transparent"
                            />
                        </div>

                        {/* Folder Selection & Date Picker */}
                        <div className="flex flex-wrap items-center gap-3">
                            {/* Date Picker */}
                            <div className="relative">
                                <input
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="pl-9 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-900/50 text-sm font-medium text-neutral-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                />
                                <Calendar size={16} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                            </div>

                            {/* Folder Picker */}
                            <div className="relative">
                                <select
                                    value={selectedFolderId}
                                    onChange={(e) => setSelectedFolderId(e.target.value)}
                                    className="appearance-none pl-9 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-900/50 text-sm font-medium text-neutral-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                                >
                                    <option value="">General (No Folder)</option>
                                    {folders.map(f => (
                                        <option key={f.id} value={f.id}>{f.name}</option>
                                    ))}
                                </select>
                                <Folder size={16} className="absolute left-3 top-2.5 text-neutral-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-h-[200px]">
                            <textarea
                                placeholder="Start writing..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                className="w-full h-full min-h-[300px] resize-none text-lg leading-relaxed placeholder-neutral-300 dark:placeholder-slate-600 border-none focus:ring-0 p-0 text-neutral-600 dark:text-slate-300 bg-transparent"
                            />
                        </div>
                    </form>

                    <div className="p-6 border-t border-neutral-100 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSaving ? 'Saving...' : (
                                <>
                                    <Save size={18} />
                                    <span>Save Changes</span>
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default EditEntryModal;
