import React from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Target } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function AnalyticsHabitChart({ data }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-neutral-100 dark:border-slate-700"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                    <Target size={20} />
                </div>
                <h2 className="text-lg font-bold text-neutral-800 dark:text-white">Habit Completion</h2>
            </div>

            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#94a3b8', fontSize: 12 }}
                            domain={[0, 100]}
                            unit="%"
                        />
                        <Tooltip
                            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                            }}
                            formatter={(value) => [`${value}%`, 'Score']}
                        />
                        <Bar
                            dataKey="score"
                            fill="#818cf8"
                            radius={[6, 6, 0, 0]}
                            maxBarSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </motion.div>
    );
}
