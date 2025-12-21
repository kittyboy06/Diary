import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { addEntry, uploadImage } from '../lib/entryService';
import { motion } from 'framer-motion';
import { Save, Image as ImageIcon, Lock, Loader, Calendar } from 'lucide-react';
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
        // setLoading(true); // Handled by toast.promise or we can keep it for button state

        const savePromise = async () => {
            let imageUrl = null;
            if (image) {
                imageUrl = await uploadImage(image, currentUser.id);
            }

            let finalDate = new Date();
            if (date) {
                // Parse local date parts from YYYY-MM-DD string
                const [y, m, d] = date.split('-').map(Number);
                // Set the date, but keep current time to preserve sorting order for today's entries
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
            });
        };

        toast.promise(savePromise(), {
            loading: 'Saving entry...',
            success: () => {
                navigate('/');
                return 'Entry saved successfully!';
            },
            error: 'Failed to save entry'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto"
        >
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
                            autoFocus
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
                                X
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-slate-700">
                        <div className="flex space-x-4">
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

                            <label className={`cursor-pointer flex items-center space-x-2 transition-colors ${isSecret ? 'text-rose-500' : 'text-neutral-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400'}`}>
                                <Lock size={20} />
                                <span className="text-sm font-medium">{isSecret ? t('secret_entry') : t('make_secret')}</span>
                                <input type="checkbox" className="hidden" checked={isSecret} onChange={(e) => setIsSecret(e.target.checked)} />
                            </label>
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center space-x-2 bg-indigo-600 text-white px-6 py-2.5 rounded-full font-medium hover:bg-indigo-700 transition-all shadow-lg hover:shadow-indigo-500/25 disabled:opacity-70 disabled:cursor-not-allowed"
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
