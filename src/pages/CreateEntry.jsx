import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addEntry, uploadImage, getFolders, getUserPin } from '../lib/entryService';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Image as ImageIcon, Lock, Loader, Calendar, Folder, Key, X } from 'lucide-react';
import { toast } from 'sonner';

const CreateEntry = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSecret, setIsSecret] = useState(false);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [mood, setMood] = useState('happy');
    const [loading, setLoading] = useState(false);

    // Folder State
    const [folders, setFolders] = useState([]);
    const [selectedFolderId, setSelectedFolderId] = useState('');

    // PIN Security State
    const [showPinModal, setShowPinModal] = useState(false);
    const [enteredPin, setEnteredPin] = useState('');
    const [userPin, setUserPin] = useState(null);

    useEffect(() => {
        const fetchFolders = async () => {
            if (currentUser?.id) {
                // Fetch folders matching the current secret state
                const data = await getFolders(currentUser.id, isSecret);
                setFolders(data || []);
                setSelectedFolderId(''); // Reset selection when mode changes (optional, but safer)
            }
        };
        fetchFolders();
    }, [currentUser, isSecret]);

    const handleToggleSecret = async (e) => {
        e.preventDefault(); // Prevent default checkbox behavior
        const targetState = !isSecret;

        if (targetState) {
            // Turning ON secret mode
            try {
                const pin = await getUserPin(currentUser.id);
                if (!pin) {
                    toast.error("Please set a PIN in Secret Log first.");
                    return;
                }
                setUserPin(pin);
                setShowPinModal(true);
            } catch (error) {
                console.error(error);
                toast.error("Failed to verify security.");
            }
        } else {
            // Turning OFF secret mode - allow immediately? 
            // Or should we require PIN to turn OFF as well? 
            // Usually un-hiding something is sensitive, but typically creating a NEW entry 
            // isn't sensitive until it's saved. But if they wrote secret content and want to make it public?
            // Let's assume toggling OFF is safe for now as requested user flow focused on "entering".
            setIsSecret(false);
        }
    };

    const handlePinSubmit = (e) => {
        e.preventDefault();
        if (enteredPin === userPin) {
            setIsSecret(true);
            setShowPinModal(false);
            setEnteredPin('');
            toast.success("Secret Mode Enabled");
        } else {
            toast.error("Incorrect PIN");
            setEnteredPin('');
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const MOODS = [
        { id: 'happy', label: 'Happy', emoji: '😃' },
        { id: 'neutral', label: 'Neutral', emoji: '😐' },
        { id: 'sad', label: 'Sad', emoji: '😔' },
        { id: 'angry', label: 'Angry', emoji: '😡' },
        { id: 'excited', label: 'Excited', emoji: '🤩' },
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title && !content) return;

        const savePromise = async () => {
            let imageUrl = null;
            if (image) {
                imageUrl = await uploadImage(image, currentUser.id);
            }

            let finalDate = new Date();
            if (date) {
                const [y, m, d] = date.split('-').map(Number);
                finalDate.setFullYear(y);
                finalDate.setMonth(m - 1);
                finalDate.setDate(d);
            }

            await addEntry(currentUser.id, {
                title,
                content,
                imageUrl,
                isSecret,
                mood,
                date: finalDate.toISOString(),
                folderId: selectedFolderId || null
            });
        };

        toast.promise(savePromise(), {
            loading: 'Saving entry...',
            success: () => {
                // Stay on page: clear form
                setTitle('');
                setContent('');
                setImage(null);
                setPreview(null);
                // Keep date, mood, folder, secret settings as they are for quick consecutive entry

                return 'Entry saved! Ready for next one.';
            },
            error: 'Failed to save entry'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto relative px-4 md:px-8 py-8"
        >
            <AnimatePresence>
                {showPinModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 z-50 rounded-3xl backdrop-blur-md bg-white/80 dark:bg-slate-900/90 flex flex-col items-center justify-center p-6 border border-rose-100 dark:border-rose-900/30"
                    >
                        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-rose-100 dark:border-rose-900/50 w-full max-w-sm text-center">
                            <div className="bg-rose-100 dark:bg-rose-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
                                <Lock size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-neutral-800 dark:text-white mb-2">{t('enter_pin')}</h3>
                            <p className="text-sm text-neutral-500 dark:text-slate-400 mb-6">{t('locked_msg_short') || "Enter PIN to access Secret Folders"}</p>

                            <form onSubmit={handlePinSubmit} className="space-y-4">
                                <input
                                    type="password"
                                    autoFocus
                                    maxLength={6}
                                    value={enteredPin}
                                    onChange={(e) => setEnteredPin(e.target.value)}
                                    className="w-full text-center text-2xl tracking-widest p-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-neutral-50 dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none"
                                />
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setShowPinModal(false); setEnteredPin(''); }}
                                        className="flex-1 px-4 py-2 rounded-xl text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 bg-rose-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-rose-900/20"
                                    >
                                        Unlock
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 dark:border-slate-700 bg-neutral-50/50 dark:bg-slate-900/50">
                    <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">{t('new_entry')}</h1>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Mood Selector */}
                    <div className="flex justify-center space-x-4 pb-4 border-b border-neutral-100 dark:border-slate-700">
                        {MOODS.map((m) => (
                            <button
                                key={m.id}
                                type="button"
                                onClick={() => setMood(m.id)}
                                className={`text-3xl p-3 rounded-2xl transition-all duration-300 ${mood === m.id
                                    ? 'bg-indigo-100 dark:bg-indigo-900/30 scale-110 shadow-sm'
                                    : 'hover:bg-neutral-50 dark:hover:bg-slate-700 grayscale hover:grayscale-0 opacity-70 hover:opacity-100'
                                    }`}
                                title={m.label}
                            >
                                {m.emoji}
                            </button>
                        ))}
                    </div>

                    <div>
                        <input
                            type="text"
                            placeholder={t('title_placeholder')}
                            className="w-full text-xl font-semibold placeholder-neutral-400 dark:placeholder-slate-500 border-none focus:ring-0 p-0 text-neutral-800 dark:text-white bg-transparent"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        // autoFocus - Removed to prevent conflict with modal focus if triggered
                        />
                    </div>

                    <div>
                        <textarea
                            placeholder={t('content_placeholder')}
                            className="w-full h-64 resize-none text-lg leading-relaxed placeholder-neutral-400 dark:placeholder-slate-500 border-none focus:ring-0 p-0 text-neutral-600 dark:text-slate-300 bg-transparent"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    {preview && (
                        <div className="relative rounded-xl overflow-hidden shadow-sm">
                            <img src={preview} alt="Preview" className="w-full h-auto max-h-96 object-cover" />
                            <button
                                type="button"
                                onClick={() => { setImage(null); setPreview(null); }}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-black/70"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-neutral-100 dark:border-slate-700">
                        <div className="flex flex-wrap items-center gap-4">
                            <label className="cursor-pointer flex items-center space-x-2 text-neutral-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                                <ImageIcon size={20} />
                                <span className="text-sm font-medium hidden sm:inline">{t('add_image')}</span>
                                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                            </label>

                            <div
                                onClick={() => document.getElementById('date-picker').showPicker()}
                                className="cursor-pointer flex items-center space-x-2 text-neutral-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors relative"
                            >
                                <Calendar size={20} />
                                <span className="text-sm font-medium">
                                    {date === new Date().toISOString().split('T')[0] ? 'Today' : new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                                <input
                                    id="date-picker"
                                    type="date"
                                    className="absolute inset-0 opacity-0 w-full h-full pointer-events-none"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                />
                            </div>

                            {/* Folder Selector - ONLY show if folders exist (which means secret validation passed or we are in public mode) */}
                            {folders.length > 0 && (
                                <div className="relative">
                                    <select
                                        value={selectedFolderId}
                                        onChange={(e) => setSelectedFolderId(e.target.value)}
                                        className="appearance-none pl-8 pr-8 py-1 rounded-full border border-neutral-200 dark:border-slate-700 bg-transparent text-sm text-neutral-600 dark:text-slate-300 focus:ring-0 outline-none cursor-pointer hover:border-indigo-400 transition-all max-w-[150px] truncate"
                                    >
                                        <option value="" className="bg-white dark:bg-slate-800 text-neutral-900 dark:text-white">{isSecret ? 'General Secret' : 'General'}</option>
                                        {folders.map(f => (
                                            <option key={f.id} value={f.id} className="bg-white dark:bg-slate-800 text-neutral-900 dark:text-white">{f.name}</option>
                                        ))}
                                    </select>
                                    <Folder size={16} className="absolute left-2.5 top-1.5 text-neutral-400 pointer-events-none" />
                                </div>
                            )}

                            <label className={`cursor-pointer flex items-center space-x-2 transition-colors ${isSecret ? 'text-rose-500' : 'text-neutral-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'}`}>
                                <Lock size={20} />
                                <span className="text-sm font-medium">{isSecret ? t('secret_entry') : t('make_secret')}</span>
                                <input
                                    type="checkbox"
                                    className="hidden"
                                    checked={isSecret}
                                    onClick={handleToggleSecret} // Use onClick to intercept
                                    onChange={() => { }} // Controlled manually
                                />
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full md:w-auto flex items-center justify-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>{t('save_entry')}</span>
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
};

export default CreateEntry;
