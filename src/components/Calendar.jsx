import React, { useState, useEffect } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const Calendar = ({ entries }) => {
    const { t } = useLanguage();
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const onDateClick = (day) => setSelectedDate(day);

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const dateFormat = "d";
    const weeks = [];
    let days = [];
    let day = startDate;
    let formattedDate = "";

    const daysInMonth = eachDayOfInterval({
        start: startDate,
        end: endDate
    });

    const MOOD_COLORS = {
        'happy': 'bg-yellow-200 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200',
        'neutral': 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
        'sad': 'bg-blue-200 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200',
        'angry': 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-200',
        'excited': 'bg-purple-200 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200',
        'calm': 'bg-green-200 dark:bg-green-900/50 text-green-800 dark:text-green-200',
        'anxious': 'bg-orange-200 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700 p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-800 dark:text-white capitalize">
                    {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full text-neutral-600 dark:text-slate-300 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-neutral-100 dark:hover:bg-slate-700 rounded-full text-neutral-600 dark:text-slate-300 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((dayName) => (
                    <div key={dayName} className="text-center text-xs font-semibold text-neutral-400 dark:text-slate-500 uppercase tracking-wider py-2">
                        {dayName}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((dayItem, idx) => {
                    // Check if there's an entry for this day
                    const dayEntry = entries.find(e =>
                        e.date && isSameDay(e.date.toDate(), dayItem)
                    );

                    const isCurrentMonth = isSameMonth(dayItem, monthStart);
                    const isToday = isSameDay(dayItem, new Date());

                    let moodColorClass = "";
                    if (dayEntry && dayEntry.mood) {
                        moodColorClass = MOOD_COLORS[dayEntry.mood.toLowerCase()] || 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200';
                    } else if (dayEntry) {
                        moodColorClass = 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200';
                    }

                    return (
                        <div
                            key={idx}
                            className={`
                                relative h-14 rounded-xl flex items-start justify-start p-2 text-sm font-medium transition-all
                                ${!isCurrentMonth ? 'text-neutral-300 dark:text-slate-700' : 'text-neutral-700 dark:text-slate-300'}
                                ${isToday ? 'ring-2 ring-indigo-500 bg-indigo-50 dark:bg-slate-700' : ''}
                                ${isCurrentMonth ? 'hover:bg-neutral-50 dark:hover:bg-slate-700 cursor-pointer' : ''}
                                ${moodColorClass ? moodColorClass : ''}
                            `}
                            onClick={() => onDateClick(dayItem)}
                        >
                            <span>{format(dayItem, 'd')}</span>
                            {dayEntry && (
                                <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-current opacity-70"></div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-neutral-500 dark:text-slate-400">
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-indigo-500"></div> Entry</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-400"></div> Happy</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-blue-400"></div> Sad</div>
            </div>
        </div>
    );
};

export default Calendar;
