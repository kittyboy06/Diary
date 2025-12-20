import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getEntryStats } from '../lib/entryService';
import { Sun, CheckCircle } from 'lucide-react';

const Home = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState({ streak: 0, totalEntries: 0 });

    useEffect(() => {
        if (currentUser?.id) {
            const fetchStats = async () => {
                const data = await getEntryStats(currentUser.id);
                setStats(data);
            };
            fetchStats();
        }
    }, [currentUser]);

    // Placeholder greeting logic
    const hour = new Date().getHours();
    const greetingKey = hour < 12 ? 'greeting_morning' : hour < 18 ? 'greeting_afternoon' : 'greeting_evening';
    const greeting = t(greetingKey);

    return (
        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden"
            >
                <div className="relative z-10">
                    <p className="opacity-80 font-medium mb-1 flex items-center gap-2">
                        <Sun size={18} />
                        {format(new Date(), 'EEEE, MMMM do, yyyy')}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
                        {greeting}, {currentUser?.email?.split('@')[0] || 'Friend'}!
                    </h1>
                    <p className="text-lg opacity-90 max-w-2xl">
                        "Keep your face always toward the sunshine—and shadows will fall behind you."
                        <br /><span className="text-sm opacity-75 mt-2 block">— Walt Whitman</span>
                    </p>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-300 opacity-20 rounded-full blur-2xl"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats or Actions */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white">{t('streak')}</h3>
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600 dark:text-orange-400">
                            🔥
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.streak} Day{stats.streak !== 1 ? 's' : ''}</p>
                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">{t('keep_it_up')}</p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white">{t('entries')}</h3>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-full text-blue-600 dark:text-blue-400">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-neutral-900 dark:text-white">{stats.totalEntries}</p>
                    <p className="text-sm text-neutral-500 dark:text-slate-400 mt-1">{t('total_written')}</p>
                </motion.div>
            </div>
        </div>
    );
};

export default Home;
