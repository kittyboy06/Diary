import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import Calendar from '../components/Calendar';
import { getEntryStats, getEntries } from '../lib/entryService';
import { Sun, CheckCircle } from 'lucide-react';

const Home = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState({ streak: 0, totalEntries: 0 });
    const [entries, setEntries] = useState([]);

    useEffect(() => {
        if (currentUser?.id) {
            const fetchData = async () => {
                const statsData = await getEntryStats(currentUser.id);
                setStats(statsData);
                const entriesData = await getEntries(currentUser.id);
                setEntries(entriesData);
            };
            fetchData();
        }
    }, [currentUser]);

    // Placeholder greeting logic
    const hour = new Date().getHours();
    const greetingKey = hour < 12 ? 'greeting_morning' : hour < 18 ? 'greeting_afternoon' : 'greeting_evening';
    const greeting = t(greetingKey);

    // Anime Quotes
    const QUOTES = [
        { text: "If you don't fight, you can't win!", author: "Eren Yeager (Attack on Titan)" },
        { text: "The only thing we're allowed to do is believe that we won't regret the choice we made.", author: "Levi Ackerman (Attack on Titan)" },
        { text: "A true warrior needs no sword.", author: "Thors (Vinland Saga)" },
        { text: "It's not about whether you can or can't do it. I'm doing it because I want to.", author: "Shirou Emiya (Fate/stay night)" },
        { text: "If you want to grant your own wish, then you should clear your own path to it.", author: "Rintarou Okabe (Steins;Gate)" },
        { text: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger as well as kinder.", author: "Gildarts Clive (Fairy Tail)" },
        { text: "People, who can't throw something important away, can never hope to change anything.", author: "Armin Arlert (Attack on Titan)" },
        { text: "Change is what you do when you want to alter reality.", author: "Ichigo Kurosaki (Bleach)" },
        { text: "If you pick a fight with a god of death, I can't guarantee your soul's safety.", author: "Hei (Darker Than Black)" },
        { text: "Go beyond! Plus Ultra!", author: "All Might (My Hero Academia)" },
        { text: "A pro is someone who risks their life!", author: "All Might (My Hero Academia)" },
        { text: "I have no enemies.", author: "Thorfinn (Vinland Saga)" },
        { text: "Even the mightiest warriors experience fears. What makes them a true warrior is the courage that they possess to overcome their fears.", author: "Vegeta (Dragon Ball Z)" },
        { text: "If I don't have to do it, I won't. If I have to do it, I'll make it quick.", author: "Houtarou Oreki (Hyouka)" },

        // Self-Care & Habits (Exercise, Water, Learning)
        { text: "Take care of your body. It's the only place you have to live.", author: "Jim Rohn" },
        { text: "Water is the driving force of all nature. Stay hydrated!", author: "Leonardo da Vinci" },
        { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
        { text: "Exercise to be fit, not skinny. Eat to nourish your body.", author: "Unknown" },
        { text: "The capacity to learn is a gift; the ability to learn is a skill; the willingness to learn is a choice.", author: "Brian Herbert" },
        { text: "A healthy outside starts from the inside. Drink your water.", author: "Robert Urich" },
        { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
        { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
        { text: "Physical fitness is not only one of the most important keys to a healthy body, it is the basis of dynamic and creative intellectual activity.", author: "John F. Kennedy" },
        { text: "Do something today that your future self will thank you for.", author: "Unknown" }
    ];

    const [randomQuote] = useState(() => QUOTES[Math.floor(Math.random() * QUOTES.length)]);

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
                        {greeting}, {currentUser?.user_metadata?.username || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || 'Friend'}!
                    </h1>
                    <p className="text-lg opacity-90 max-w-2xl italic">
                        "{randomQuote.text}"
                        <br /><span className="text-sm opacity-75 mt-2 block not-italic">— {randomQuote.author}</span>
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

                {/* Calendar Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-2 lg:col-span-1"
                >
                    <Calendar entries={entries} />
                </motion.div>
            </div>
        </div >
    );
};

export default Home;
