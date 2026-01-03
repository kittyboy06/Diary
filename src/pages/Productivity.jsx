import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    createHabit,
    updateHabit,
    getHabits,
    toggleHabitCompletion,
    getHabitCompletions,
    deleteHabit,
    getCollections,
    createCollection,
    deleteCollection,
    getDailyMetrics,
    updateScreenTime
} from '../lib/habitService';
import { Plus, Trash2, ChevronLeft, ChevronRight, Check, FolderPlus, Folder, MoreVertical, X, Edit2, ChevronDown, ChevronUp, Smartphone, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, startOfWeek, endOfWeek, isSameMonth, getDaysInMonth } from 'date-fns';
import { toast } from 'sonner';
import Skeleton from '../components/Skeleton';
import ScreenTimeCard from '../components/ScreenTimeCard';
import HabitCard from '../components/HabitCard';
import { AnimatePresence, motion } from 'framer-motion';


export default function Productivity() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();

    // Data State
    const [habits, setHabits] = useState([]);
    const [collections, setCollections] = useState([]);
    const [completions, setCompletions] = useState([]);
    const [screenTimeResponse, setScreenTimeResponse] = useState(null); // { hours, minutes } derived from DB
    const [loading, setLoading] = useState(true);

    // UI State
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [calendarMonth, setCalendarMonth] = useState(new Date());

    const [showAddModal, setShowAddModal] = useState(false);
    const [showCollectionModal, setShowCollectionModal] = useState(false);
    const [expandedCollections, setExpandedCollections] = useState(new Set());
    const [editingHabit, setEditingHabit] = useState(null);

    // Forms
    const [newHabitName, setNewHabitName] = useState('');
    const [newHabitGoal, setNewHabitGoal] = useState(30);
    const [newHabitColor, setNewHabitColor] = useState('indigo');
    const [selectedCollection, setSelectedCollection] = useState('');
    const [newCollectionName, setNewCollectionName] = useState('');


    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser, calendarMonth]); // Reload completions when month changes

    useEffect(() => {
        // Load screen time when date changes
        if (currentUser) {
            loadScreenTime(selectedDate);
        }
    }, [currentUser, selectedDate]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [habitsData, collectionsData] = await Promise.all([
                getHabits(currentUser.id),
                getCollections(currentUser.id)
            ]);

            setHabits(habitsData || []);
            setCollections(collectionsData || []);

            // Auto-expand all collections
            const allCollectionIds = new Set(collectionsData?.map(c => c.id));
            setExpandedCollections(allCollectionIds);

            // Load completions for current calendar view (+/- buffer)
            const start = format(startOfWeek(startOfMonth(calendarMonth)), 'yyyy-MM-dd');
            const end = format(endOfWeek(endOfMonth(calendarMonth)), 'yyyy-MM-dd');
            const completionsData = await getHabitCompletions(currentUser.id, start, end);
            setCompletions(completionsData || []);
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const loadScreenTime = async (date) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const data = await getDailyMetrics(currentUser.id, dateStr);
            if (data && data.screen_time_minutes !== null) {
                const totalMins = data.screen_time_minutes;
                setScreenTimeResponse({
                    hours: Math.floor(totalMins / 60),
                    minutes: totalMins % 60
                });
            } else {
                setScreenTimeResponse(null); // Reset if no data
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleSaveScreenTime = async (h, m) => {
        const totalMinutes = (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
        const dateStr = format(selectedDate, 'yyyy-MM-dd');

        // Optimistic UI
        setScreenTimeResponse({ hours: h, minutes: m });

        try {
            await updateScreenTime(currentUser.id, dateStr, totalMinutes);
            toast.success('Screen time saved');
        } catch (error) {
            toast.error('Failed to save screen time');
            loadScreenTime(selectedDate); // Revert
        }
    };

    const handleSaveHabit = async (e) => {
        e.preventDefault();
        try {
            if (editingHabit) {
                // Update
                await updateHabit(editingHabit.id, {
                    name: newHabitName,
                    target_days: newHabitGoal,
                    color: newHabitColor,
                    collection_id: selectedCollection || null
                });
                toast.success('Habit updated');
            } else {
                // Create
                await createHabit(currentUser.id, newHabitName, newHabitGoal, newHabitColor, selectedCollection || null);
                toast.success('Habit created');
            }
            closeModal();
            loadData();
        } catch (error) {
            toast.error(editingHabit ? 'Failed to update habit' : 'Failed to create habit');
        }
    };

    const openEditModal = (habit) => {
        setEditingHabit(habit);
        setNewHabitName(habit.name);
        setNewHabitGoal(habit.target_days);
        setNewHabitColor(habit.color);
        setSelectedCollection(habit.collection_id || '');
        setShowAddModal(true);
    };

    const closeModal = () => {
        setShowAddModal(false);
        setEditingHabit(null);
        setNewHabitName('');
        setNewHabitGoal(getDaysInMonth(calendarMonth)); // Reset to max days of current view
        setNewHabitColor('indigo');
        setSelectedCollection('');
    };

    const handleOpenAdd = () => {
        setNewHabitGoal(getDaysInMonth(calendarMonth));
        setShowAddModal(true);
    };

    const handleAddCollection = async (e) => {
        e.preventDefault();
        try {
            await createCollection(currentUser.id, newCollectionName);
            toast.success('Collection created');
            setShowCollectionModal(false);
            setNewCollectionName('');
            loadData();
        } catch (error) {
            toast.error('Failed to create collection');
        }
    };

    const handleDeleteHabit = async (id) => {
        if (!confirm('Delete this habit?')) return;
        try {
            await deleteHabit(id);
            toast.success('Deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleDeleteCollection = async (id) => {
        if (!confirm('Delete collection? Habits will be unassigned.')) return;
        try {
            await deleteCollection(id);
            toast.success('Collection deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete collection');
        }
    };

    const toggleCollection = (id) => {
        const newSet = new Set(expandedCollections);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setExpandedCollections(newSet);
    };

    const handleToggle = async (habitId) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        // Optimistic Update
        const isCompleted = completions.some(c => c.habit_id === habitId && c.date === dateStr);
        let newCompletions;
        if (isCompleted) {
            newCompletions = completions.filter(c => !(c.habit_id === habitId && c.date === dateStr));
        } else {
            newCompletions = [...completions, { habit_id: habitId, date: dateStr }];
        }
        setCompletions(newCompletions);

        try {
            await toggleHabitCompletion(currentUser.id, habitId, dateStr);
        } catch (error) {
            toast.error('Failed to update');
            loadData();
        }
    };

    const getCompletionCount = (habitId) => {
        return completions.filter(c => c.habit_id === habitId).length;
    };

    const isHabitCompletedToday = (habitId) => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        return completions.some(c => c.habit_id === habitId && c.date === dateStr);
    };

    // --- Grouping Logic ---
    const unassignedHabits = habits.filter(h => !h.collection_id);
    const groupedHabits = collections.map(col => ({
        ...col,
        habits: habits.filter(h => h.collection_id === col.id)
    }));

    // --- Calendar helpers ---
    const calendarDays = eachDayOfInterval({
        start: startOfWeek(startOfMonth(calendarMonth)),
        end: endOfWeek(endOfMonth(calendarMonth))
    });

    const COLORS = [
        { id: 'indigo', class: 'bg-indigo-500' },
        { id: 'rose', class: 'bg-rose-500' },
        { id: 'emerald', class: 'bg-emerald-500' },
        { id: 'amber', class: 'bg-amber-500' },
        { id: 'sky', class: 'bg-sky-500' },
        { id: 'violet', class: 'bg-violet-500' },
    ];

    if (loading && habits.length === 0) return <Skeleton className="h-96 w-full rounded-3xl" />;

    return (
        <div className="max-w-7xl mx-auto pb-20 px-4 md:px-8 pt-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">Productivity</h1>
                    <p className="text-neutral-500 dark:text-slate-400">Track your habits and screen time</p>
                </div>
                <Link to="/productivity/analytics" className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors">
                    <BarChart2 size={20} />
                    <span>Analytics</span>
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* LEFT: Calendar Panel used for selection */}
                <div className="lg:w-96 shrink-0 space-y-4 md:space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 md:p-6 shadow-sm border border-neutral-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4 md:mb-6">
                            <h2 className="text-lg md:text-xl font-bold text-neutral-800 dark:text-white capitalize w-32">
                                {format(calendarMonth, 'MMMM yyyy')}
                            </h2>
                            <div className="flex gap-2">
                                <button onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <ChevronLeft size={18} />
                                </button>
                                <button onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-7 mb-2">
                            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                                <div key={d} className="text-center text-xs font-semibold text-neutral-400 dark:text-slate-500 py-2">{d}</div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                            {calendarDays.map(day => {
                                const isSelected = isSameDay(day, selectedDate);
                                const isCurrentMonth = isSameMonth(day, calendarMonth);
                                const isTodayDate = isToday(day);

                                // Calculate completion rate for this day
                                const dayStr = format(day, 'yyyy-MM-dd');
                                const dayCompletions = completions.filter(c => c.date === dayStr).length;
                                const totalActiveHabits = habits.length; // Simplified
                                const intensity = totalActiveHabits > 0 ? dayCompletions / totalActiveHabits : 0;

                                return (
                                    <button
                                        key={day.toString()}
                                        onClick={() => { setSelectedDate(day); }}
                                        className={`
                                        relative h-9 w-9 md:h-10 md:w-10 rounded-full flex items-center justify-center text-xs md:text-sm font-medium transition-all mx-auto
                                        ${!isCurrentMonth ? 'text-neutral-300 dark:text-slate-700' : 'text-neutral-700 dark:text-slate-300'}
                                        ${isSelected ? 'bg-indigo-600 text-white shadow-md scale-110 z-10' : 'hover:bg-neutral-100 dark:hover:bg-slate-700'}
                                        ${isTodayDate && !isSelected ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800' : ''}
                                    `}
                                    >
                                        {format(day, 'd')}
                                        {/* Dot indicator for completions */}
                                        {!isSelected && dayCompletions > 0 && (
                                            <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${intensity === 1 ? 'bg-emerald-500' : 'bg-indigo-400'}`} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Stats Panel */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
                        <h3 className="text-lg font-semibold opacity-90 mb-1">{format(selectedDate, 'EEEE, MMMM do')}</h3>
                        <p className="opacity-75 text-sm mb-6">Daily Summary</p>

                        <div className="flex items-end gap-2 mb-2">
                            <span className="text-4xl font-bold">
                                {completions.filter(c => c.date === format(selectedDate, 'yyyy-MM-dd')).length}
                            </span>
                            <span className="text-lg opacity-70 mb-1">/ {habits.length}</span>
                        </div>
                        <p className="text-sm font-medium opacity-90">Habits Completed</p>

                        <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-white/90 transition-all duration-500 ease-out"
                                style={{ width: `${habits.length ? (completions.filter(c => c.date === format(selectedDate, 'yyyy-MM-dd')).length / habits.length) * 100 : 0}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: Habit List for Selected Date */}
                <div className="flex-1 space-y-6">
                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700 sticky top-4 z-20">
                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white pl-2">
                            Habits
                        </h2>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowCollectionModal(true)}
                                className="p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-slate-700 text-neutral-600 dark:text-slate-300 transition-colors"
                                title="New Collection"
                            >
                                <FolderPlus size={20} />
                            </button>
                            <button
                                onClick={handleOpenAdd}
                                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 font-medium"
                            >
                                <Plus size={20} />
                                <span>New Habit</span>
                            </button>
                        </div>
                    </div>

                    {/* Screen Time Card */}
                    <ScreenTimeCard
                        hours={screenTimeResponse?.hours ?? ''}
                        minutes={screenTimeResponse?.minutes ?? ''}
                        onSave={handleSaveScreenTime}
                    />

                    <div className="space-y-6">
                        {habits.length === 0 ? (
                            <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-neutral-200 dark:border-slate-700">
                                <p className="text-neutral-400 dark:text-slate-500 mb-4">No habits yet.</p>
                                <button onClick={handleOpenAdd} className="text-indigo-600 font-medium hover:underline">Create your first habit</button>
                            </div>
                        ) : (
                            <>
                                {/* 1. Unassigned Habits */}
                                <div className="grid gap-3">
                                    {unassignedHabits.map(habit => (
                                        <HabitCard
                                            key={habit.id}
                                            habit={habit}
                                            isCompleted={isHabitCompletedToday(habit.id)}
                                            handleToggle={() => handleToggle(habit.id)}
                                            handleDelete={() => handleDeleteHabit(habit.id)}
                                            handleEdit={() => openEditModal(habit)}
                                            streak={getCompletionCount(habit.id)}
                                        />
                                    ))}
                                </div>

                                {/* 2. Collections */}
                                {groupedHabits.map(col => {
                                    const isExpanded = expandedCollections.has(col.id);
                                    return (
                                        <div key={col.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-neutral-100 dark:border-slate-700 transition-all">
                                            <div
                                                onClick={() => toggleCollection(col.id)}
                                                className="bg-neutral-50/50 dark:bg-slate-900/50 p-4 flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-slate-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-neutral-400 dark:text-slate-500'}`}>
                                                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                                    </div>
                                                    <Folder className={`${isExpanded ? 'text-indigo-500' : 'text-neutral-400'}`} size={20} />
                                                    <h3 className={`font-bold ${isExpanded ? 'text-neutral-800 dark:text-white' : 'text-neutral-600 dark:text-slate-400'}`}>{col.name}</h3>
                                                    <span className="text-xs font-medium bg-neutral-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-neutral-600 dark:text-slate-300">{col.habits.length}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteCollection(col.id); }}
                                                    className="text-neutral-300 hover:text-red-500 p-2 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>

                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                    >
                                                        <div className="p-4 grid gap-3 border-t border-neutral-100 dark:border-slate-800/50">
                                                            {col.habits.length === 0 && <p className="text-sm text-neutral-400 italic">No habits in this collection.</p>}
                                                            {col.habits.map(habit => (
                                                                <HabitCard
                                                                    key={habit.id}
                                                                    habit={habit}
                                                                    isCompleted={isHabitCompletedToday(habit.id)}
                                                                    handleToggle={() => handleToggle(habit.id)}
                                                                    handleDelete={() => handleDeleteHabit(habit.id)}
                                                                    handleEdit={() => openEditModal(habit)}
                                                                    streak={getCompletionCount(habit.id)}
                                                                />
                                                            ))}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>
                </div>

                {/* MODALS (Simplified for brevity) */}
                <AnimatePresence>
                    {showAddModal && (
                        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeModal}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
                                <h2 className="text-2xl font-bold mb-6 text-neutral-800 dark:text-white">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</h2>
                                <form onSubmit={handleSaveHabit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-500 mb-1">Habit Name</label>
                                        <input type="text" required className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-500 mb-1">Goal (Days)</label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    max={getDaysInMonth(calendarMonth)}
                                                    className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                    value={newHabitGoal}
                                                    onChange={e => setNewHabitGoal(e.target.value)}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setNewHabitGoal(getDaysInMonth(calendarMonth))}
                                                    className="px-3 py-1 bg-neutral-100 dark:bg-slate-700 rounded-xl text-xs font-bold text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                >
                                                    MAX
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-neutral-500 mb-1">Collection</label>
                                            <select className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={selectedCollection} onChange={e => setSelectedCollection(e.target.value)}>
                                                <option value="">None</option>
                                                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 pt-2">
                                        {COLORS.map(c => (
                                            <button key={c.id} type="button" onClick={() => setNewHabitColor(c.id)} className={`w-8 h-8 rounded-full ${c.class} ${newHabitColor === c.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`} />
                                        ))}
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button type="button" onClick={closeModal} className="flex-1 py-2.5 bg-neutral-100 rounded-xl font-medium text-neutral-600 hover:bg-neutral-200">Cancel</button>
                                        <button type="submit" className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 shadow-lg shadow-indigo-200">{editingHabit ? 'Save Changes' : 'Create'}</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>
                    {showCollectionModal && (
                        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCollectionModal(false)}>
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} onClick={e => e.stopPropagation()} className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl">
                                <h2 className="text-xl font-bold mb-4 text-neutral-800 dark:text-white">New Collection</h2>
                                <form onSubmit={handleAddCollection} className="space-y-4">
                                    <input type="text" placeholder="Collection Name" required className="w-full p-3 rounded-xl border border-neutral-200 bg-neutral-50 dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500" value={newCollectionName} onChange={e => setNewCollectionName(e.target.value)} />
                                    <div className="flex gap-3 pt-2">
                                        <button type="button" onClick={() => setShowCollectionModal(false)} className="flex-1 py-2.5 bg-neutral-100 rounded-xl font-medium text-neutral-600 hover:bg-neutral-200">Cancel</button>
                                        <button type="submit" className="flex-1 py-2.5 bg-neutral-800 text-white rounded-xl font-medium hover:bg-neutral-900">Create</button>
                                    </div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}



