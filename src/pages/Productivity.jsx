import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getHabitLogs, logHabit, getTodayHabits } from '../lib/habitService';
import { Target, Activity, CheckCircle, Flame } from 'lucide-react';
import { ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis } from 'recharts';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay } from 'date-fns';

export default function Productivity() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);

    // Default Habits
    const [habits, setHabits] = useState({
        exercise: false,
        water: false,
        learning: false
    });

    const [stats, setStats] = useState([]);
    const [streak, setStreak] = useState(0);
    const [totalDays, setTotalDays] = useState(0);

    const HABIT_CONFIG = [
        { id: 'exercise', label: 'Exercise', emoji: '🏃‍♂️', color: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        { id: 'water', label: 'Drink Water', emoji: '💧', color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        { id: 'learning', label: 'Learning', emoji: '📚', color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
    ];

    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser]);

    const loadData = async () => {
        try {
            setLoading(true);
            // Load Today's status
            const todayHabits = await getTodayHabits(currentUser.id);
            if (todayHabits) setHabits(todayHabits);

            // Load History for charts (last 30 days)
            const endDate = new Date();
            const startDate = subDays(endDate, 30);
            const logs = await getHabitLogs(currentUser.id, format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'));

            processStats(logs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const processStats = (logs) => {
        // Calculate Streak
        let currentStreak = 0;
        const sortedLogs = [...logs].reverse(); // Newest first

        // Simple streak logic: check if any habit was done per day backwards
        // (This is a simplified streak, usually requires checking yesterday, day before, etc.)
        // For visual demo, we'll count total distinct active days in fetched range
        const activeDays = logs.filter(l => Object.values(l.habits).some(v => v)).length;
        setTotalDays(activeDays);
        setStreak(activeDays); // Placeholder logic for streak

        // Prepare Chart Data
        // Map last 10 days
        const last14Days = Array.from({ length: 14 }).map((_, i) => {
            const date = subDays(new Date(), 13 - i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const log = logs.find(l => l.date === dateStr);

            let score = 0;
            if (log && log.habits) {
                if (log.habits.exercise) score += 33;
                if (log.habits.water) score += 33;
                if (log.habits.learning) score += 34;
            }

            return {
                date: format(date, 'dd MMM'),
                score
            };
        });
        setStats(last14Days);
    };

    const toggleHabit = async (id) => {
        const newHabits = { ...habits, [id]: !habits[id] };
        setHabits(newHabits);

        // Optimistic UI, then save
        try {
            await logHabit(currentUser.id, format(new Date(), 'yyyy-MM-dd'), newHabits);
            // Reload stats to update charts immediately (optional, or local update)
            loadData();
        } catch (error) {
            console.error("Failed to save habit", error);
        }
    };

    if (loading) return <div className="p-8 text-center text-neutral-500">Loading Productivity...</div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-800 dark:text-white flex items-center gap-3">
                        <Target className="text-indigo-600 dark:text-indigo-400" />
                        Productivity Hub
                    </h1>
                    <p className="text-neutral-500 dark:text-slate-400 mt-2">Track your daily wins and build consistency.</p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-orange-50 dark:bg-orange-900/20 px-4 py-3 rounded-2xl flex items-center gap-3 border border-orange-100 dark:border-orange-800/50">
                        <Flame className="text-orange-500" size={24} />
                        <div>
                            <p className="text-xs text-orange-600/80 dark:text-orange-400 uppercase font-bold tracking-wider">Active Days</p>
                            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{streak}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Today's Logger */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700">
                <h2 className="text-lg font-semibold text-neutral-800 dark:text-white mb-6 flex items-center gap-2">
                    <CheckCircle size={20} className="text-neutral-400" />
                    Today's Goals
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {HABIT_CONFIG.map((h) => (
                        <button
                            key={h.id}
                            onClick={() => toggleHabit(h.id)}
                            className={`
                                relative overflow-hidden p-4 rounded-2xl border-2 transition-all duration-300
                                flex flex-col items-center justify-center gap-2 h-32
                                ${habits[h.id]
                                    ? `border-transparent ${h.color} shadow-lg scale-[1.02]`
                                    : 'border-neutral-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600 bg-neutral-50 dark:bg-slate-900 text-neutral-400 grayscale'
                                }
                            `}
                        >
                            <span className="text-4xl filter drop-shadow-sm">{h.emoji}</span>
                            <span className="font-bold text-sm tracking-wide">{h.label}</span>

                            {habits[h.id] && (
                                <div className="absolute top-2 right-2">
                                    <CheckCircle size={16} fill="currentColor" className="text-current opacity-50" />
                                </div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Analytics - Trend Chart */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-sm border border-neutral-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-lg font-semibold text-neutral-800 dark:text-white flex items-center gap-2">
                            <Activity size={20} className="text-neutral-400" />
                            Consistency Trend
                        </h2>
                        <p className="text-sm text-neutral-400 mt-1">Completion rate over last 14 days</p>
                    </div>
                </div>

                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12 }}
                                dy={10}
                            />
                            <YAxis hide domain={[0, 100]} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1e293b',
                                    border: 'none',
                                    borderRadius: '12px',
                                    color: '#fff',
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                                formatter={(value) => [`${Math.round(value)}%`, 'Completion']}
                            />
                            <Area
                                type="monotone"
                                dataKey="score"
                                stroke="#6366f1"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
