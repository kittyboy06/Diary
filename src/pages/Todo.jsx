import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Plus, Trash2, CheckCircle, Circle, AlertCircle, Calendar, Folder, FolderPlus, X, Menu } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getTodos, createTodo, updateTodo, deleteTodo, getFolders, createFolder, deleteFolder } from '../lib/todoService';
import { toast } from 'sonner';
import Skeleton from '../components/Skeleton';

export default function Todo() {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [todos, setTodos] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState('all'); // all, unassigned, or folderId
    const [loading, setLoading] = useState(true);
    const [newTask, setNewTask] = useState('');
    const [newDeadline, setNewDeadline] = useState('');
    const [newFolderName, setNewFolderName] = useState('');
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    useEffect(() => {
        if (currentUser) {
            loadData();
        }
    }, [currentUser, selectedFolder]); // Reload tasks when folder changes

    const loadData = async () => {
        try {
            setLoading(true);
            const [todosData, foldersData] = await Promise.all([
                getTodos(currentUser.id, selectedFolder),
                getFolders(currentUser.id)
            ]);
            setTodos(todosData || []);
            // Only update folders list if we're not reloading just for task filter
            if (folders.length === 0 || foldersData.length !== folders.length) {
                setFolders(foldersData || []);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        try {
            const folder = await createFolder(currentUser.id, newFolderName);
            setFolders([...folders, folder]);
            setNewFolderName('');
            setIsCreatingFolder(false);
            toast.success('Folder created');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create folder');
        }
    };

    const handleDeleteFolder = async (folderId, e) => {
        e.stopPropagation();
        if (!window.confirm('Delete folder and all its tasks?')) return;

        try {
            await deleteFolder(folderId);
            setFolders(folders.filter(f => f.id !== folderId));
            if (selectedFolder === folderId) setSelectedFolder('all');
            toast.success('Folder deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete folder');
        }
    };

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) return;

        try {
            const tempId = Date.now();
            const optimisticTodo = {
                id: tempId,
                text: newTask,
                completed: false,
                created_at: new Date().toISOString(),
                deadline: newDeadline ? new Date(newDeadline).toISOString() : null
            };

            setTodos([optimisticTodo, ...todos]);
            setNewTask('');
            setNewDeadline('');

            // Pass current folder if it's a specific user folder, else null (unassigned)
            const folderIdToUse = (selectedFolder !== 'all' && selectedFolder !== 'unassigned') ? selectedFolder : null;

            const created = await createTodo(currentUser.id, newTask, newDeadline || null, folderIdToUse);

            // Replace optimistic with real
            setTodos(prev => prev.map(t => t.id === tempId ? created : t));
        } catch (error) {
            console.error(error);
            toast.error('Failed to add task');
            loadTodos(); // Revert
        }
    };

    const handleToggle = async (id, currentStatus) => {
        try {
            // Optimistic update
            setTodos(prev => prev.map(t =>
                t.id === id ? { ...t, completed: !currentStatus } : t
            ));

            await updateTodo(id, { completed: !currentStatus });
        } catch (error) {
            console.error(error);
            toast.error('Failed to update task');
            loadTodos(); // Revert
        }
    };

    const handleDelete = async (id) => {
        try {
            // Optimistic update
            setTodos(prev => prev.filter(t => t.id !== id));
            await deleteTodo(id);
            toast.success('Task deleted');
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete task');
            loadTodos(); // Revert
        }
    };

    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    if (loading && todos.length === 0) {
        return (
            <div className="max-w-2xl mx-auto p-4 space-y-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
                <Skeleton className="h-16 w-full rounded-xl" />
            </div>
        );
    }

    return (
        <div className="relative flex h-[calc(100dvh-theme(spacing.20))] md:h-[calc(100vh-theme(spacing.20))] overflow-hidden">
            {/* Mobile Sidebar Overlay */}
            {showSidebar && (
                <div className="absolute inset-0 bg-black/50 z-20 md:hidden" onClick={() => setShowSidebar(false)} />
            )}

            {/* Sidebar */}
            <aside className={`
                absolute md:relative z-30 w-64 h-full bg-white dark:bg-slate-900 border-r border-neutral-200 dark:border-slate-800
                transition-transform duration-300 md:translate-x-0
                ${showSidebar ? 'translate-x-0' : '-translate-x-full'}
                flex flex-col
            `}>
                <div className="p-4 border-b border-neutral-100 dark:border-slate-800 flex justify-between items-center">
                    <h2 className="font-semibold text-neutral-800 dark:text-white">Folders</h2>
                    <button onClick={() => setShowSidebar(false)} className="md:hidden text-neutral-500">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <button
                        onClick={() => { setSelectedFolder('all'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors ${selectedFolder === 'all'
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <CheckSquare size={18} />
                        All Tasks
                    </button>

                    <button
                        onClick={() => { setSelectedFolder('unassigned'); setShowSidebar(false); }}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-sm font-medium transition-colors ${selectedFolder === 'unassigned'
                            ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                            : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
                            }`}
                    >
                        <Folder size={18} />
                        Unassigned
                    </button>

                    <div className="pt-4 pb-2 px-2 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                        My Folders
                    </div>

                    {folders.map(folder => (
                        <div
                            key={folder.id}
                            onClick={() => { setSelectedFolder(folder.id); setShowSidebar(false); }}
                            className={`group w-full flex items-center justify-between p-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${selectedFolder === folder.id
                                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                : 'text-neutral-600 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Folder size={18} />
                                <span className="truncate">{folder.name}</span>
                            </div>
                            <button
                                onClick={(e) => handleDeleteFolder(folder.id, e)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 text-neutral-400"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-neutral-100 dark:border-slate-800">
                    {isCreatingFolder ? (
                        <form onSubmit={handleCreateFolder} className="flex gap-2">
                            <input
                                autoFocus
                                type="text"
                                value={newFolderName}
                                onChange={(e) => setNewFolderName(e.target.value)}
                                placeholder="Name..."
                                className="flex-1 bg-neutral-100 dark:bg-slate-800 rounded px-2 py-1 text-sm outline-none ring-1 ring-transparent focus:ring-indigo-500 dark:text-white"
                                onBlur={() => !newFolderName && setIsCreatingFolder(false)}
                            />
                            <button type="submit" disabled={!newFolderName} className="text-indigo-600">
                                <Plus size={18} />
                            </button>
                        </form>
                    ) : (
                        <button
                            onClick={() => setIsCreatingFolder(true)}
                            className="flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-indigo-600 transition-colors"
                        >
                            <FolderPlus size={18} />
                            New Folder
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
                <div className="max-w-3xl mx-auto pb-20">
                    <div className="flex items-center gap-3 mb-8">
                        <button onClick={() => setShowSidebar(true)} className="md:hidden p-2 -ml-2 text-neutral-500">
                            <Menu size={24} />
                        </button>
                        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                            {selectedFolder === 'all' ? <CheckSquare size={28} /> :
                                selectedFolder === 'unassigned' ? <Folder size={28} /> :
                                    <Folder size={28} />}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-900 dark:text-white">
                                {selectedFolder === 'all' ? 'All Tasks' :
                                    selectedFolder === 'unassigned' ? 'Unassigned' :
                                        folders.find(f => f.id === selectedFolder)?.name || 'Folder'}
                            </h1>
                            <p className="text-neutral-500 dark:text-slate-400 font-medium">
                                {activeTodos.length} pending tasks
                            </p>
                        </div>
                    </div>

                    {/* Add Task Form */}
                    <form onSubmit={handleAddTodo} className="relative mb-8 group">
                        <div className="relative">
                            <input
                                type="text"
                                value={newTask}
                                onChange={(e) => setNewTask(e.target.value)}
                                placeholder="Add a new task..."
                                className="w-full pl-6 pr-32 py-4 bg-white dark:bg-slate-800 border-none shadow-sm rounded-2xl text-lg outline-none ring-1 ring-neutral-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-shadow dark:text-white placeholder:text-neutral-400"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <input
                                    type="date"
                                    value={newDeadline}
                                    onChange={(e) => setNewDeadline(e.target.value)}
                                    className="bg-transparent text-xs text-neutral-500 dark:text-slate-400 border border-neutral-200 dark:border-slate-600 rounded-lg px-2 py-1 outline-none focus:border-indigo-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newTask.trim()}
                                    className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors"
                                >
                                    <Plus size={24} />
                                </button>
                            </div>
                        </div>
                    </form>

                    <div className="space-y-6">
                        {/* Active Tasks */}
                        <div className="space-y-3">
                            <AnimatePresence mode="popLayout">
                                {activeTodos.length === 0 && completedTodos.length === 0 && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-neutral-400"
                                    >
                                        <CheckSquare size={48} className="mx-auto mb-4 opacity-20" />
                                        <p>No tasks yet. Add one above!</p>
                                    </motion.div>
                                )}

                                {activeTodos.map(todo => (
                                    <motion.div
                                        key={todo.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="group flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-neutral-100 dark:border-slate-700 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors"
                                    >
                                        <button
                                            onClick={() => handleToggle(todo.id, todo.completed)}
                                            className="flex-shrink-0 text-neutral-300 hover:text-indigo-500 transition-colors"
                                        >
                                            <Circle size={24} />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`font-medium break-all text-neutral-800 dark:text-slate-200 ${todo.completed ? 'line-through text-neutral-400' : ''}`}>
                                                {todo.text}
                                            </p>
                                            {todo.deadline && (
                                                <div className={`flex items-center gap-1 text-xs mt-1 ${!todo.completed && isPast(new Date(todo.deadline)) && !isToday(new Date(todo.deadline))
                                                    ? 'text-red-500 font-medium'
                                                    : 'text-neutral-400'
                                                    }`}>
                                                    <Calendar size={12} />
                                                    <span>
                                                        {isToday(new Date(todo.deadline)) ? 'Today' :
                                                            isTomorrow(new Date(todo.deadline)) ? 'Tomorrow' :
                                                                format(new Date(todo.deadline), 'MMM d')}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(todo.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Completed Tasks */}
                        {completedTodos.length > 0 && (
                            <div className="pt-4 border-t border-neutral-100 dark:border-slate-800">
                                <h3 className="text-sm font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Completed</h3>
                                <div className="space-y-2 opacity-60">
                                    {completedTodos.map(todo => (
                                        <motion.div
                                            key={todo.id}
                                            layout
                                            className="flex items-center gap-4 p-3 rounded-lg bg-neutral-50 dark:bg-slate-800/50"
                                        >
                                            <button
                                                onClick={() => handleToggle(todo.id, todo.completed)}
                                                className="flex-shrink-0 text-emerald-500"
                                            >
                                                <CheckCircle size={24} />
                                            </button>
                                            <span className="flex-1 text-neutral-500 dark:text-slate-500 line-through decoration-2 decoration-neutral-300 dark:decoration-slate-600 break-all">
                                                {todo.text}
                                            </span>
                                            <button
                                                onClick={() => handleDelete(todo.id)}
                                                className="p-2 text-neutral-400 hover:text-red-500 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
