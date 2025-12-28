import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { format, subDays } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

import { getEntryStats, getEntries } from '../lib/entryService';
import { getHabitStats, getHabits, getHabitCompletions, toggleHabitCompletion } from '../lib/habitService';
import { Sun, CheckCircle, Flame, Target } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { toast } from 'sonner';

const Home = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [stats, setStats] = useState({ streak: 0, totalEntries: 0 });
    const [chartData, setChartData] = useState([]);

    // Habits State
    const [habits, setHabits] = useState([]);
    const [todayCompletions, setTodayCompletions] = useState([]);

    useEffect(() => {
        if (currentUser?.id) {
            const fetchData = async () => {
                const statsData = await getEntryStats(currentUser.id);
                setStats(statsData);

                // Fetch Habit Data
                const endDate = new Date();
                const startDate = subDays(endDate, 14);
                const endDateStr = format(endDate, 'yyyy-MM-dd');

                const [habitStats, habitsList, completions] = await Promise.all([
                    getHabitStats(currentUser.id, format(startDate, 'yyyy-MM-dd'), endDateStr),
                    getHabits(currentUser.id),
                    getHabitCompletions(currentUser.id, endDateStr, endDateStr) // Just for today
                ]);

                setHabits(habitsList || []);
                setTodayCompletions(completions || []);

                const processedData = Array.from({ length: 14 }).map((_, i) => {
                    const date = subDays(new Date(), 13 - i);
                    const dateStr = format(date, 'yyyy-MM-dd');
                    const stat = habitStats.find(s => s.date === dateStr);

                    return {
                        date: format(date, 'dd MMM'),
                        score: stat ? stat.score : 0
                    };
                });
                setChartData(processedData);
            };
            fetchData();
        }
    }, [currentUser]);

    const handleToggleHabit = async (habitId) => {
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        // Optimistic UI
        const isCompleted = todayCompletions.some(c => c.habit_id === habitId);
        let newCompletions;
        if (isCompleted) {
            newCompletions = todayCompletions.filter(c => c.habit_id !== habitId);
        } else {
            newCompletions = [...todayCompletions, { habit_id: habitId, date: todayStr }];
        }
        setTodayCompletions(newCompletions);

        try {
            await toggleHabitCompletion(currentUser.id, habitId, todayStr);
        } catch (error) {
            toast.error("Failed to update habit");
            // Revert on error could be added here
        }
    };

    // Placeholder greeting logic
    const hour = new Date().getHours();
    const greetingKey = hour < 12 ? 'greeting_morning' : hour < 18 ? 'greeting_afternoon' : 'greeting_evening';
    const greeting = t(greetingKey);

    const QUOTES = [
        { text: "If you don't fight, you can't win!", author: "Eren Yeager (Attack on Titan)" },
        { text: "The only thing we're allowed to do is believe that we won't regret the choice we made.", author: "Levi Ackerman" },
        { text: "Motivation is what gets you started. Habit is what keeps you going.", author: "Jim Ryun" },
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
                        {greeting}, {currentUser?.user_metadata?.username || currentUser?.user_metadata?.full_name || 'Friend'}!
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

                {/* Today's Focus Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="md:col-span-2 lg:col-span-1 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700"
                >
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white">Today's Focus</h3>
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                            <Target size={20} />
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[200px] overflow-y-auto scrollbar-hide">
                        {habits.length === 0 ? (
                            <p className="text-sm text-neutral-400 italic">No habits set. Go to Productivity to add one!</p>
                        ) : (
                            habits.slice(0, 5).map(habit => {
                                const isCompleted = todayCompletions.some(c => c.habit_id === habit.id);
                                return (
                                    <div
                                        key={habit.id}
                                        onClick={() => handleToggleHabit(habit.id)}
                                        className={`
                                            flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer group
                                            ${isCompleted
                                                ? `bg-${habit.color}-500 border-${habit.color}-500 text-white`
                                                : 'bg-neutral-50 dark:bg-slate-900/50 border-neutral-100 dark:border-slate-700 hover:border-indigo-300'
                                            }
                                        `}
                                    >
                                        <span className="font-medium text-sm truncate max-w-[150px]">{habit.habit_collections?.name || habit.name}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isCompleted ? 'border-white bg-white/20' : `border-${habit.color}-400 group-hover:bg-${habit.color}-100`}`}>
                                            {isCompleted && <CheckCircle size={12} fill="currentColor" />}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                        {habits.length > 5 && (
                            <p className="text-xs text-center text-neutral-400">...and {habits.length - 5} more</p>
                        )}
                    </div>
                </motion.div>

                {/* Productivity Chart Widget */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="md:col-span-2 lg:col-span-3 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700"
                >
                    <div className="flex items-center gap-2 mb-4">
                        <h3 className="font-semibold text-lg text-neutral-800 dark:text-white">Productivity Trend</h3>
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">Last 14 Days</span>
                    </div>
                    <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorScoreHome" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis hide domain={[0, 100]} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e293b',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: '#fff',
                                        fontSize: '12px'
                                    }}
                                    formatter={(value) => [`${Math.round(value)}%`, 'Completion']}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="score"
                                    stroke="#818cf8"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorScoreHome)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>
        </div >
    );
};

export default Home;
