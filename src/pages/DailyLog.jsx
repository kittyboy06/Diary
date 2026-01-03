import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getEntries, deleteEntry, getFolders, createFolder, deleteFolder, toggleFavorite, updateEntry } from '../lib/entryService';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Trash2, Lock, Calendar, Search, Filter, Folder, Plus, X, Star, Edit2 } from 'lucide-react';
import Skeleton from '../components/Skeleton';

import EditEntryModal from '../components/EditEntryModal';
import SecureImage from '../components/SecureImage';
import { toast } from 'sonner';

const DailyLog = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [entries, setEntries] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(location.state?.folderId || 'Uncategorized'); // 'Uncategorized' means General (no folder), null means All
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMood, setSelectedMood] = useState('All');
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);

    // Editing State
    const [editingEntry, setEditingEntry] = useState(null);

    const [newFolderName, setNewFolderName] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [expandedEntries, setExpandedEntries] = useState(new Set());
    const PAGE_SIZE = 10;

    const MOOD_MAP = {
        'happy': '😃',
        'neutral': '😐',
        'sad': '😔',
        'angry': '😡',
        'excited': '🤩',
        'calm': '😌',
        'anxious': '😰'
    };

    const fetchData = async (reset = false) => {
        if (reset) {
            setLoading(true);
            setEntries([]);
            setPage(0);
            setHasMore(true);
        }

        try {
            const currentPage = reset ? 0 : page;
            const [entriesData, foldersData] = await Promise.all([
                getEntries(currentUser.id, false, selectedFolder, currentPage, PAGE_SIZE),
                reset ? getFolders(currentUser.id, false) : Promise.resolve(null) // Only fetch folders on reset/init
            ]);

            if (entriesData.length < PAGE_SIZE) {
                setHasMore(false);
            }

            setEntries(prev => reset ? entriesData : [...prev, ...entriesData]);

            if (reset && foldersData) {
                setFolders(foldersData);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    // Fetch on page change (if not reset)
    useEffect(() => {
        if (page > 0) {
            fetchData(false);
        }
    }, [page]);

    // Re-fetch when folder changes
    useEffect(() => {
        fetchData(true);
    }, [currentUser, selectedFolder]);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        const promise = createFolder(currentUser.id, newFolderName);
        toast.promise(promise, {
            loading: 'Creating folder...',
            success: (data) => {
                setFolders([...folders, data]);
                setNewFolderName('');
                setShowNewFolderInput(false);
                return 'Folder created!';
            },
            error: 'Failed to create folder'
        });
    };

    const handleDeleteFolder = async (folderId, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this folder? Entries in it will remain but be unassigned.")) return;

        const promise = deleteFolder(folderId);
        toast.promise(promise, {
            loading: 'Deleting folder...',
            success: () => {
                setFolders(folders.filter(f => f.id !== folderId));
                if (selectedFolder === folderId) setSelectedFolder(null);
                return 'Folder deleted';
            },
            error: 'Failed to delete folder'
        });
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('delete_confirm'))) {
            await deleteEntry(id);
            setEntries(entries.filter(e => e.id !== id));
        }
    }

    const handleUpdateEntry = async (id, updates) => {
        const promise = updateEntry(id, updates);
        toast.promise(promise, {
            loading: 'Updating entry...',
            success: (updatedData) => {
                // Update local state
                setEntries(entries.map(e => {
                    if (e.id === id) {
                        return {
                            ...e,
                            ...updates,
                            date: updates.date ? { toDate: () => new Date(updates.date) } : e.date,
                            folder: updates.folderId ? folders.find(f => f.id === updates.folderId) : null,
                            folderId: updates.folderId
                        };
                    }
                    return e;
                }));
                // If we moved it out of the current folder filter, we might want to remove it from view?
                // For now user just wants to edit.
                if (selectedFolder && selectedFolder !== 'Uncategorized' && updates.folderId && updates.folderId !== selectedFolder) {
                    // It was moved OUT of this folder
                    setEntries(prev => prev.filter(e => e.id !== id));
                }

                return 'Entry updated!';
            },
            error: 'Failed to update entry'
        });
    };

    const handleToggleFavorite = async (e, entry) => {
        e.stopPropagation();
        const newStatus = !entry.isFavorite;

        // Optimistic UI update
        const updatedEntries = entries.map(ent =>
            ent.id === entry.id ? { ...ent, isFavorite: newStatus } : ent
        ).sort((a, b) => { // Re-sort locally to reflect change immediately
            // Sort by favorite (true first) -> date (desc)
            if (a.isFavorite === b.isFavorite) {
                return b.date.toDate() - a.date.toDate();
            }
            return b.isFavorite ? 1 : -1;
        });

        setEntries(updatedEntries);

        try {
            await toggleFavorite(entry.id, newStatus);
        } catch (error) {
            console.error("Failed to toggle favorite:", error);
            toast.error("Failed to update favorite");
            fetchData(true); // Revert on error
        }
    };

    const toggleExpand = (id) => {
        setExpandedEntries(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const filteredEntries = entries.filter(entry => {
        const matchesSearch = (entry.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
            (entry.content?.toLowerCase() || '').includes(searchQuery.toLowerCase());
        const matchesMood = selectedMood === 'All' || entry.mood === selectedMood;
        return matchesSearch && matchesMood;
    });

    if (loading && !entries.length && page === 0) { // Only show skeleton on initial load
        return (
            <div className="space-y-6">
                <div className="flex justify-between items-center mb-8">
                    <Skeleton className="h-10 w-48 rounded-xl" />
                    <div className="flex gap-2">
                        <Skeleton className="h-10 w-64 rounded-xl" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                    </div>
                </div>
                <div className="grid gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-48 rounded-md" />
                                    <Skeleton className="h-4 w-32 rounded-md" />
                                </div>
                                <Skeleton className="h-6 w-6 rounded-full" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-3/4" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-neutral-800 dark:text-white">{t('daily_log')}</h1>

                <div className="flex gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder={t('search_placeholder')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder-neutral-400 dark:placeholder-slate-500"
                        />
                        <div className="absolute left-3 top-2.5 text-neutral-400 dark:text-slate-500">
                            <Search size={18} />
                        </div>
                    </div>

                    {/* Mood Filter */}
                    <div className="relative">
                        <select
                            value={selectedMood}
                            onChange={(e) => setSelectedMood(e.target.value)}
                            className="appearance-none pl-10 pr-8 py-2 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer"
                        >
                            <option value="All">{t('all_moods')}</option>
                            <option value="Happy">Happy</option>
                            <option value="Sad">Sad</option>
                            <option value="Excited">Excited</option>
                            <option value="Calm">Calm</option>
                            <option value="Anxious">Anxious</option>
                        </select>
                        <div className="absolute left-3 top-2.5 text-neutral-400 dark:text-slate-500 pointer-events-none">
                            <Filter size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Folders Section */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                <button
                    onClick={() => setSelectedFolder('Uncategorized')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedFolder === 'Uncategorized'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700'
                        }`}
                >
                    <Folder size={18} />
                    <span>General</span>
                </button>

                {folders.map(folder => (
                    <div
                        key={folder.id}
                        onClick={() => setSelectedFolder(folder.id)}
                        className={`group relative flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${selectedFolder === folder.id
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Folder size={18} />
                        <span>{folder.name}</span>
                        <button
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="ml-2 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setSelectedFolder(null)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedFolder === null
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700'
                        }`}
                >
                    <Folder size={18} />
                    <span>All Entries</span>
                </button>

                {showNewFolderInput ? (
                    <form onSubmit={handleCreateFolder} className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-900/50">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Folder Name"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 p-0 text-sm text-neutral-800 dark:text-white w-32 placeholder-neutral-400"
                        />
                        <button type="submit" className="text-indigo-600 dark:text-indigo-400">
                            <Plus size={18} />
                        </button>
                        <button type="button" onClick={() => setShowNewFolderInput(false)} className="text-neutral-400 hover:text-neutral-600">
                            <X size={18} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowNewFolderInput(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-dashed border-neutral-300 dark:border-slate-600 text-neutral-500 dark:text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all whitespace-nowrap"
                    >
                        <Plus size={18} />
                        <span>New Folder</span>
                    </button>
                )}
            </div>

            {/* Edit Modal */}
            <EditEntryModal
                isOpen={!!editingEntry}
                onClose={() => setEditingEntry(null)}
                entry={editingEntry}
                folders={folders}
                onSave={handleUpdateEntry}
            />

            {filteredEntries.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-neutral-100 dark:border-slate-700">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
                        <Folder size={32} />
                    </div>
                    <h2 className="text-xl font-semibold text-neutral-800 dark:text-white">{t('no_entries')}</h2>
                    <p className="text-neutral-500 dark:text-slate-400 mt-2">
                        {searchQuery ? 'Try adjusting your filters.' : 'This folder is empty.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {filteredEntries.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-neutral-100 dark:border-slate-700 hover:shadow-md transition-shadow relative group flex flex-col h-full min-h-[250px]"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-neutral-800 dark:text-white line-clamp-1" title={entry.title}>{entry.title || "Untitled"}</h2>
                                        {entry.mood && MOOD_MAP[entry.mood.toLowerCase()] && (
                                            <span className="text-xl" title={entry.mood}>
                                                {MOOD_MAP[entry.mood.toLowerCase()]}
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-sm text-neutral-400 dark:text-slate-500 font-medium flex items-center gap-2">
                                            <Calendar size={14} />
                                            {entry.date ? format(entry.date.toDate(), 'PPP') : 'Just now'}
                                        </p>
                                        {entry.folder && (
                                            <span className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full flex items-center gap-1 line-clamp-1 max-w-[100px]">
                                                <Folder size={10} />
                                                {entry.folder.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => handleToggleFavorite(e, entry)}
                                        className={`p-1.5 rounded-full transition-colors ${entry.isFavorite ? 'text-amber-400 hover:text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-neutral-300 dark:text-slate-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700'}`}
                                        title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        <Star size={16} fill={entry.isFavorite ? "currentColor" : "none"} />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingEntry(entry);
                                        }}
                                        className="text-neutral-300 hover:text-indigo-500 p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit Entry"
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    {entry.isSecret && <Lock className="text-rose-400" size={16} />}
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation(); // prevent card click
                                            handleDelete(entry.id);
                                        }}
                                        className="text-neutral-300 hover:text-red-500 p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                        title={t('delete_confirm')}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div
                                onClick={() => toggleExpand(entry.id)}
                                className="prose prose-neutral dark:prose-invert max-w-none text-neutral-600 dark:text-slate-300 cursor-pointer flex-1"
                            >
                                <p className={`whitespace-pre-wrap ${expandedEntries.has(entry.id) ? '' : 'line-clamp-6'}`}>
                                    {entry.content}
                                </p>
                                {!expandedEntries.has(entry.id) && entry.content.length > 150 && (
                                    <span className="text-indigo-500 text-sm font-medium hover:underline mt-1 block">Read more</span>
                                )}
                            </div>

                            {
                                entry.imageUrl && (
                                    <div className="mt-4 rounded-xl overflow-hidden h-40 w-full bg-neutral-100 dark:bg-slate-900 shrink-0">
                                        <SecureImage path={entry.imageUrl} alt="Entry attachment" className="w-full h-full object-cover" />
                                    </div>
                                )
                            }
                        </motion.div>
                    ))}
                </div>
            )}

            {hasMore && !loading && entries.length > 0 && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleLoadMore}
                        className="bg-white dark:bg-slate-800 text-neutral-600 dark:text-slate-300 px-6 py-2 rounded-full border border-neutral-200 dark:border-slate-700 hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Load More Entries
                    </button>
                </div>
            )}
            {loading && page > 0 && (
                <div className="flex justify-center pt-6">
                    <Skeleton className="h-10 w-32 rounded-full" />
                </div>
            )}
        </div>
    );
};

export default DailyLog;
