import React from 'react';
import { Check, Edit2, Trash2 } from 'lucide-react';

export default function HabitCard({ habit, isCompleted, handleToggle, handleDelete, handleEdit, streak }) {
    return (
        <div
            onClick={handleToggle}
            className={`
                group relative flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer select-none
                ${isCompleted
                    ? `bg-${habit.color}-500 border-${habit.color}-600 text-white shadow-lg shadow-${habit.color}-500/20`
                    : 'bg-white dark:bg-slate-800 border-neutral-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-slate-600'
                }
            `}
        >
            <div className="flex items-center gap-4">
                <div
                    className={`
                        w-8 h-8 rounded-xl flex items-center justify-center transition-all
                        ${isCompleted ? 'bg-white/20' : `bg-${habit.color}-100 dark:bg-slate-700 text-${habit.color}-500`}
                    `}
                >
                    {isCompleted ? <Check size={18} strokeWidth={3} /> : <div className={`w-3 h-3 rounded-full bg-${habit.color}-500`} />}
                </div>
                <div>
                    <h3 className={`font-bold text-lg leading-tight ${isCompleted ? 'text-white' : 'text-neutral-800 dark:text-slate-200'}`}>{habit.name}</h3>
                    <p className={`text-xs font-medium ${isCompleted ? 'text-white/80' : 'text-neutral-400'}`}>Goal: {habit.target_days} days • Completed: {streak}</p>
                </div>
            </div>

            <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); handleEdit(); }}
                    className={`p-2 rounded-lg transition-colors ${isCompleted ? 'hover:bg-white/20 text-white' : 'hover:bg-indigo-50 text-neutral-300 hover:text-indigo-500'}`}
                >
                    <Edit2 size={18} />
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                    className={`p-2 rounded-lg transition-colors ${isCompleted ? 'hover:bg-white/20 text-white' : 'hover:bg-red-50 text-neutral-300 hover:text-red-500'}`}
                >
                    <Trash2 size={18} />
                </button>
            </div>
        </div>
    );
}
