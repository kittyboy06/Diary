import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isToday, isTomorrow, isPast } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { getEntryStats, getEntries } from '../lib/entryService';
import { getUpcomingTodos } from '../lib/todoService';
import { Sun, CheckCircle, Flame, AlertCircle, Clock } from 'lucide-react';

import { toast } from 'sonner';

const Home = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState({ streak: 0, totalEntries: 0 });
    const [deadlines, setDeadlines] = useState([]);

    useEffect(() => {
        if (currentUser?.id) {
            const fetchData = async () => {
                const statsData = await getEntryStats(currentUser.id);
                setStats(statsData);

                const upcoming = await getUpcomingTodos(currentUser.id, 4);
                setDeadlines(upcoming || []);
            };
            fetchData();
        }
    }, [currentUser]);



    // Placeholder greeting logic
    const hour = new Date().getHours();
    const greetingKey = hour < 12 ? 'greeting_morning' : hour < 18 ? 'greeting_afternoon' : 'greeting_evening';
    const greeting = t(greetingKey);

    const QUOTES = [
        { text: "If you win, you live. If you lose, you die. If you don't fight, you can't win!", author: "Eren Yeager (Attack on Titan)" },
        { text: "This world is cruel... but it's also very beautiful.", author: "Mikasa Ackerman" },
        { text: "My soldiers, rage! My soldiers, scream! My soldiers, fight!", author: "Erwin Smith" },
        { text: "The only thing we're allowed to do is to believe that we won't regret the choice we made.", author: "Levi Ackerman" },
        { text: "Someone who can't sacrifice anything, can't ever change anything.", author: "Armin Arlert" },
        { text: "Hard work is worthless for those that don't believe in themselves.", author: "Naruto Uzumaki" },
        { text: "The moment people come to know love, they run the risk of carrying hate.", author: "Obito Uchiha" },
        { text: "It is foolish to fear what we have yet to see and know.", author: "Itachi Uchiha" },
        { text: "Knowing what it feels to be in pain, is exactly why we try to be kind to others.", author: "Jiraiya" },
        { text: "A dropout will beat a genius through hard work.", author: "Rock Lee" },
        { text: "I am the man who will become the King of the Pirates!", author: "Monkey D. Luffy" },
        { text: "When do you think people die? When they are forgotten.", author: "Dr. Hiriluk" },
        { text: "Scars on the back are a swordsman's shame.", author: "Roronoa Zoro" },
        { text: "Pirates are evil? The Marines are righteous? Justice will prevail, you say? But of course it will! Whoever wins this war becomes justice!", author: "Donquixote Doflamingo" },
        { text: "No matter how hard or impossible it is, never lose sight of your goal.", author: "Monkey D. Luffy" },
        { text: "It's fine now. Why? Because I am here!", author: "All Might" },
        { text: "Giving help that's not asked for... is what makes a true hero!", author: "Izuku Midoriya" },
        { text: "Stop talking. I will win. That’s... what heroes do.", author: "Katsuki Bakugo" },
        { text: "If you wanna stop this, then stand up! Because I've got one thing to say to you. Never forget who you want to become!", author: "Shoto Todoroki" },
        { text: "Go beyond! PLUS... ULTRA!", author: "All Might" },
        { text: "If I don't wield the sword, I can't protect you. If I keep wielding the sword, I can't embrace you.", author: "Ichigo Kurosaki" },
        { text: "Admiration is the furthest thing from understanding.", author: "Sōsuke Aizen" },
        { text: "I loathe perfection! If something is perfect, then there is nothing left.", author: "Mayuri Kurotsuchi" },
        { text: "Fear is necessary for evolution. The fear that one could be destroyed at any moment.", author: "Sōsuke Aizen" },
        { text: "It’s meaningless to just live, and it’s meaningless to just fight. I want to win.", author: "Ichigo Kurosaki" }
    ];

    const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentQuoteIndex((prev) => (prev + 1) % QUOTES.length);
        }, 15000); // Change quote every 15 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 md:px-8 py-8">
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
                        {greeting}, {currentUser?.user_metadata?.username || currentUser?.user_metadata?.full_name || 'Friend'}!
                    </h1>

                    <div className="min-h-[6rem] flex items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentQuoteIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.5 }}
                                className="w-full"
                            >
                                <p className="text-lg opacity-90 max-w-2xl italic">
                                    "{QUOTES[currentQuoteIndex].text}"
                                    <br /><span className="text-sm opacity-75 mt-2 block not-italic">— {QUOTES[currentQuoteIndex].author}</span>
                                </p>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
                {/* Decorative circles */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-purple-300 opacity-20 rounded-full blur-2xl"></div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Quick Stats */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 hover:shadow-md transition-shadow"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white">{t('streak')}</h3>
                        <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-full text-orange-600 dark:text-orange-400">
                            <Flame size={20} />
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




                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-2 lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white">Upcoming Deadlines</h3>
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-full text-amber-600 dark:text-amber-400">
                            <Clock size={20} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        {deadlines.length === 0 ? (
                            <p className="text-sm text-neutral-400 italic">No upcoming deadlines.</p>
                        ) : (
                            deadlines.map(todo => {
                                const date = new Date(todo.deadline);
                                const isOverdue = isPast(date) && !isToday(date);
                                return (
                                    <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-slate-900/50 border border-neutral-100 dark:border-slate-700">
                                        <div className={`p-1.5 rounded-full ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            <AlertCircle size={14} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-800 dark:text-slate-200 truncate">{todo.text}</p>
                                            <p className={`text-xs ${isOverdue ? 'text-red-500 font-medium' : 'text-neutral-400'}`}>
                                                {isToday(date) ? 'Due Today' : isTomorrow(date) ? 'Due Tomorrow' : format(date, 'MMM d, h:mm a')}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </motion.div>
            </div>
        </div >
    );
};

export default Home;
