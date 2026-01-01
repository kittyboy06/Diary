import React, { useState, useEffect } from 'react';
import { Smartphone, Edit2, Clock } from 'lucide-react';
import TimeWheel from './TimeWheel';

export default function ScreenTimeCard({ hours, minutes, onSave }) {
    const [h, setH] = useState(hours);
    const [m, setM] = useState(minutes);
    const [isEditing, setIsEditing] = useState(false);
    const [editMode, setEditMode] = useState('hours'); // 'hours' or 'minutes'

    useEffect(() => {
        setH(hours);
        setM(minutes);
    }, [hours, minutes]);

    const handleSave = () => {
        onSave(h, m);
        setIsEditing(false);
    };

    const handleHoursChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setH('');
            return;
        }
        const num = parseInt(val);
        if (!isNaN(num)) {
            if (num < 0) setH(0);
            else if (num > 23) setH(23);
            else setH(num);
        }
    };

    const handleMinutesChange = (e) => {
        const val = e.target.value;
        if (val === '') {
            setM('');
            return;
        }
        const num = parseInt(val);
        if (!isNaN(num)) {
            if (num < 0) setM(0);
            else if (num > 59) setM(59);
            else setM(num);
        }
    };

    // Logic to determine color intensity based on usage
    // < 2h: Green, 2-5h: Yellow/Orange, > 5h: Red
    const totalMins = (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
    let colorClass = 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30';
    if (totalMins > 120) colorClass = 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30';
    if (totalMins > 300) colorClass = 'text-rose-500 bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30';

    if (!isEditing && (hours !== '' || minutes !== undefined && minutes !== null)) {
        // Display Mode
        return (
            <div
                onClick={() => setIsEditing(true)}
                className={`group flex items-center justify-between p-4 rounded-3xl border transition-all cursor-pointer ${colorClass}`}
            >
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/50 dark:bg-black/20 rounded-2xl backdrop-blur-sm">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-lg leading-tight">Screen Time: {h}h {m}m</h3>
                        <p className="text-xs font-medium opacity-80">
                            {totalMins > 300 ? 'Try to reduce this!' : 'Great balance!'}
                        </p>
                    </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-white/20 rounded-xl">
                        <Edit2 size={18} />
                    </button>
                </div>
            </div>
        );
    }

    // Edit/Empty Mode
    return (
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-neutral-100 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-neutral-100 dark:bg-slate-700 text-neutral-500 dark:text-slate-300 rounded-2xl">
                <Smartphone size={24} />
            </div>
            <div className="flex-1">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm font-bold text-neutral-800 dark:text-white">Set Screen Time</p>
                    <div className="flex bg-neutral-100 dark:bg-slate-700 p-1 rounded-xl">
                        <button
                            onClick={() => setEditMode('hours')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${editMode === 'hours' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-700'}`}
                        >
                            Hours
                        </button>
                        <button
                            onClick={() => setEditMode('minutes')}
                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${editMode === 'minutes' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 dark:text-slate-400 hover:text-neutral-700'}`}
                        >
                            Minutes
                        </button>
                    </div>
                </div>

                <div className="mb-6">
                    {editMode === 'hours' ? (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <TimeWheel
                                value={parseInt(h) || 0}
                                max={24}
                                onChange={val => setH(val)}
                            />
                            <p className="mt-4 font-bold text-2xl text-indigo-600 dark:text-indigo-400">{h} <span className="text-sm text-neutral-400 dark:text-slate-500 font-medium">hours</span></p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                            <TimeWheel
                                value={parseInt(m) || 0}
                                max={60}
                                onChange={val => setM(val)}
                            />
                            <p className="mt-4 font-bold text-2xl text-indigo-600 dark:text-indigo-400">{m} <span className="text-sm text-neutral-400 dark:text-slate-500 font-medium">minutes</span></p>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleSave}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 flex items-center justify-center gap-2"
                >
                    <Clock size={18} />
                    Save Time
                </button>
            </div>
        </div>
    );
}
