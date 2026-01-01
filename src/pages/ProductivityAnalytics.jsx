import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { ChevronLeft, BarChart2, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getHabitStats, getDailyMetricsRange, getCollections } from '../lib/habitService';
import Skeleton from '../components/Skeleton';
import AnalyticsHabitChart from '../components/AnalyticsHabitChart';
import AnalyticsScreenTimeChart from '../components/AnalyticsScreenTimeChart';

export default function ProductivityAnalytics() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [screenTimeData, setScreenTimeData] = useState([]);
    const [habitData, setHabitData] = useState([]);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('all');

    useEffect(() => {
        if (currentUser) {
            loadCollections();
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) {
            loadAnalytics();
        }
    }, [currentUser, selectedCollection]);

    const loadCollections = async () => {
        const data = await getCollections(currentUser.id);
        setCollections(data || []);
    }

    const loadAnalytics = async () => {
        setLoading(true);
        try {
            const endDate = new Date();
            const startDate = subDays(endDate, 30);
            const startDateStr = format(startDate, 'yyyy-MM-dd');
            const endDateStr = format(endDate, 'yyyy-MM-dd');

            const [habitStats, metrics] = await Promise.all([
                getHabitStats(currentUser.id, startDateStr, endDateStr, selectedCollection),
                getDailyMetricsRange(currentUser.id, startDateStr, endDateStr)
            ]);

            // Process Data to fill gaps
            const days = eachDayOfInterval({ start: startDate, end: endDate });

            const processedHabits = days.map(day => {
                const dStr = format(day, 'yyyy-MM-dd');
                const stat = habitStats.find(s => s.date === dStr);
                return {
                    date: format(day, 'dd MMM'),
                    score: stat ? stat.score : 0
                };
            });

            const processedScreenTime = days.map(day => {
                const dStr = format(day, 'yyyy-MM-dd');
                const metric = metrics.find(m => m.date === dStr);
                return {
                    date: format(day, 'dd MMM'),
                    minutes: metric ? metric.screen_time_minutes : 0,
                    hours: metric ? parseFloat((metric.screen_time_minutes / 60).toFixed(1)) : 0
                };
            });

            setHabitData(processedHabits);
            setScreenTimeData(processedScreenTime);

        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
                <Skeleton className="h-12 w-48 rounded-xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
                <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-32">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link to="/productivity" className="p-3 bg-white dark:bg-slate-800 rounded-2xl hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-neutral-600 dark:text-neutral-300">
                    <ChevronLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
                        <BarChart2 className="text-indigo-500" />
                        Analytics
                    </h1>
                    <p className="text-neutral-500 dark:text-slate-400 font-medium">Last 30 Days Overview</p>
                </div>
            </div>

            {/* Controls */}
            <div className="flex justify-end mb-6">
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
                    <select
                        value={selectedCollection}
                        onChange={(e) => setSelectedCollection(e.target.value)}
                        className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-neutral-200 dark:border-slate-700 rounded-xl text-sm font-medium text-neutral-700 dark:text-neutral-300 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                        <option value="all">All Folders</option>
                        <option value="unassigned">Unassigned</option>
                        {collections.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Habit Performance Chart */}
                <AnalyticsHabitChart data={habitData} />

                {/* Screen Time Chart */}
                <AnalyticsScreenTimeChart data={screenTimeData} />
            </div>
        </div>
    );
}
