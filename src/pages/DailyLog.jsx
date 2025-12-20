import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getEntries, deleteEntry } from '../lib/entryService';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Trash2, Lock, Calendar, Search, Filter } from 'lucide-react';

const DailyLog = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('All');

    const MOOD_MAP = {
        'happy': '😃',
        'neutral': '😐',
        'sad': '😔',
        'angry': '😡',
        'excited': '🤩',
        'calm': '😌',
        'anxious': '😰'
    };

    const HABITS = [
        { id: 'exercise', label: 'Exercise', emoji: '🏃‍♂️' },
        { id: 'water', label: 'Drink Water', emoji: '💧' },
        { id: 'learning', label: 'Learning', emoji: '📚' },
    ];

    useEffect(() => {
        const fetchEntries = async () => {
            try {
                const data = await getEntries(currentUser.id);
                setEntries(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchEntries();
    }, [currentUser]);

    const handleDelete = async (id) => {
        if (window.confirm(t('delete_confirm'))) {
            await deleteEntry(id);
            setEntries(entries.filter(e => e.id !== id));
        }
    }

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = (entry.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (entry.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesMood = selectedMood === 'All' || entry.mood === selectedMood;
        return matchesSearch && matchesMood;
    });

    if (loading) return <div className="p-10 text-center text-neutral-500">Loading your memories...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-8">
                <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">{t('daily_log')}</h1>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-neutral-400 dark:placeholder-slate-500"
                        />
                        <div className="absolute left-3 top-2.5 text-neutral-400 dark:text-slate-500">
                            <Search size={18} />
                        </div>
                    </div>

                    {/* Mood Filter */}
                    <div className="relative">
                        <select
                            value={selectedMood}
                            onChange={(e) => setSelectedMood(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="All">{t('all_moods')}</option>
                            <option value="Happy">Happy</option>
                            <option value="Sad">Sad</option>
                            <option value="Excited">Excited</option>
                            <option value="Calm">Calm</option>
                            <option value="Anxious">Anxious</option>
                        </select>
                        <div className="absolute left-3 top-2.5 text-neutral-400 dark:text-slate-500 pointer-events-none">
                            <Filter size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {filteredEntries.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-neutral-100 dark:border-slate-700">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                        <Calendar size={32} />
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">{t('no_entries')}</h2>
                    <p className="text-neutral-500 dark:text-slate-400 mt-2">Try adjusting your filters or search terms.</p>
                </div>
            ) : (
                <div className="grid gap-6">
                    {filteredEntries.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700 hover:shadow-md transition-shadow relative group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white">{entry.title || "Untitled"}</h2>
                                        {entry.mood && MOOD_MAP[entry.mood.toLowerCase()] && (
                                            <span className="text-xl" title={entry.mood}>
                                                {MOOD_MAP[entry.mood.toLowerCase()]}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-neutral-400 dark:text-slate-500 font-medium flex items-center gap-2 mt-1">
                                        <Calendar size={14} />
                                        {entry.date ? format(entry.date.toDate(), 'PPP p') : 'Just now'}
                                    </p>
                                </div>
                                {entry.isSecret && <Lock className="text-rose-400" size={18} />}
                            </div>

                            <div className="prose prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-slate-300">
                                <p className="whitespace-pre-wrap line-clamp-3">{entry.content}</p>
                            </div>

                            {/* Habits Display */}
                            {entry.habits && Object.values(entry.habits).some(v => v) && (
                                <div className="mt-3 flex gap-2">
                                    {HABITS.filter(h => entry.habits[h.id]).map(h => (
                                        <div key={h.id} className="inline-flex items-center gap-1 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg text-xs font-medium border border-green-100 dark:border-green-800">
                                            <span>{h.emoji}</span>
                                            <span>{h.label}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {entry.imageUrl && (
                                <div className="mt-4 rounded-xl overflow-hidden h-48 w-full bg-neutral-100 dark:bg-slate-900">
                                    <img src={entry.imageUrl} alt="Entry attachment" className="w-full h-full object-cover" />
                                </div>
                            )}

                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600 p-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DailyLog;
