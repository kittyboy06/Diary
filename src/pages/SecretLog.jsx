import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getEntries, deleteEntry, getUserPin, setUserPin, getFolders, createFolder, deleteFolder, toggleFavorite, updateEntry } from '../lib/entryService'; // We will assume getEntries filters secret ones separately if parameterized
import { motion } from 'framer-motion';
import { Lock, Unlock, Trash2, Key, Folder, Plus, X, Calendar, Star, Edit2, Search } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import EditEntryModal from '../components/EditEntryModal';
import SecureImage from '../components/SecureImage';

const SecretLog = () => {
    const { currentUser, signIn } = useAuth();
    const { t } = useLanguage();
    const location = useLocation();
    const [isUnlocked, setIsUnlocked] = useState(location.state?.unlocked || false);
    const [pin, setPin] = useState('');
    const [savedPin, setSavedPin] = useState(null); // Null means fetching or no PIN set
    const [isLoadingPin, setIsLoadingPin] = useState(true);
    const [isSettingPin, setIsSettingPin] = useState(false);

    const [entries, setEntries] = useState([]);
    const [folders, setFolders] = useState([]);
    const [selectedFolder, setSelectedFolder] = useState(location.state?.folderId || 'Uncategorized');
    const [loading, setLoading] = useState(false);
    const [showNewFolderInput, setShowNewFolderInput] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Editing State
    const [editingEntry, setEditingEntry] = useState(null);

    const [newFolderName, setNewFolderName] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [expandedEntries, setExpandedEntries] = useState(new Set());
    const PAGE_SIZE = 10;

    useEffect(() => {
        if (currentUser?.id) {
            checkPin();
        }
    }, [currentUser]);

    const checkPin = async () => {
        setIsLoadingPin(true);
        const p = await getUserPin(currentUser.id);
        setSavedPin(p); // If null, means no PIN set
        setIsSettingPin(!p); // If no PIN, go to setting mode
        setIsLoadingPin(false);
    };

    const handleUnlock = async (e) => {
        e.preventDefault();

        if (isSettingPin) {
            // Setting a new PIN
            if (pin.length < 4) {
                alert("PIN must be at least 4 digits"); // Consider adding translation for this too
                return;
            }
            try {
                await setUserPin(currentUser.id, pin);
                setSavedPin(pin);
                setIsSettingPin(false); // Now we move to unlock state (or just unlock immediately)
                setIsUnlocked(true);
                fetchSecretData(true);
                alert("PIN Set Successfully!");
            } catch (err) {
                console.error(err);
                alert("Failed to set PIN");
            }
        } else {
            // Verifying existing PIN
            if (pin === savedPin) {
                setIsUnlocked(true);
                fetchSecretData(true);
            } else {
                alert("Incorrect PIN");
                setPin('');
            }
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('delete_confirm'))) {
            await deleteEntry(id);
            setEntries(entries.filter(e => e.id !== id));
        }
    };

    const handleUpdateEntry = async (id, updates) => {
        const promise = updateEntry(id, updates);
        toast.promise(promise, {
            loading: 'Updating secret...',
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
                // If we moved it out of the current folder filter
                if (selectedFolder && selectedFolder !== 'Uncategorized' && updates.folderId && updates.folderId !== selectedFolder) {
                    setEntries(prev => prev.filter(e => e.id !== id));
                }

                return 'Secret updated!';
            },
            error: 'Failed to update'
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
            fetchSecretData(true); // Revert on error
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

    // Re-fetch when folder changes AND unlocked
    useEffect(() => {
        if (isUnlocked) {
            fetchSecretData(true);
        }
    }, [selectedFolder]);

    const fetchSecretData = async (reset = false) => {
        if (!currentUser) return; // Prevent fetching if user not loaded
        if (reset) {
            setLoading(true);
            setEntries([]);
            setPage(0);
            setHasMore(true);
        }

        try {
            const currentPage = reset ? 0 : page;
            const [entriesData, foldersData] = await Promise.all([
                getEntries(currentUser.id, true, selectedFolder, currentPage, PAGE_SIZE, true), // includeSecret=true (ignored if onlySecret=true), onlySecret=true
                reset ? getFolders(currentUser.id, true) : Promise.resolve(null)
            ]);

            setEntries(prev => reset ? entriesData : [...prev, ...entriesData]);

            if (entriesData.length < PAGE_SIZE) {
                setHasMore(false);
            }

            if (reset && foldersData) {
                setFolders(foldersData || []);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to load secret data");
        } finally {
            setLoading(false);
        }
    };

    const handleLoadMore = () => {
        setPage(prev => prev + 1);
    };

    // Fetch on page change (if not reset)
    useEffect(() => {
        if (page > 0 && isUnlocked) {
            fetchSecretData(false);
        }
    }, [page]);

    const handleCreateFolder = async (e) => {
        e.preventDefault();
        if (!newFolderName.trim()) return;

        const promise = createFolder(currentUser.id, newFolderName, 'red', true); // isSecret = true
        toast.promise(promise, {
            loading: 'Creating secret folder...',
            success: (data) => {
                setFolders([...folders, data]);
                setNewFolderName('');
                setShowNewFolderInput(false);
                return 'Secret folder created!';
            },
            error: 'Failed to create folder'
        });
    };

    const handleDeleteFolder = async (folderId, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this folder? Entries will be unassigned.")) return;

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


    if (isLoadingPin) {
        return <div className="p-10 text-center text-neutral-500">Checking Security...</div>;
    }

    if (!isUnlocked) {
        return (
            <div className="max-w-md mx-auto py-20 text-center">
                <div className="bg-rose-100 dark:bg-rose-900/30 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
                    {isSettingPin ? <Key size={40} /> : <Lock size={40} />}
                </div>
                <h2 className="text-2xl font-bold text-neutral-800 dark:text-white mb-2">
                    {isSettingPin ? t('set_pin_title') : t('locked_title')}
                </h2>
                <p className="text-neutral-500 dark:text-slate-400 mb-8">
                    {isSettingPin ? t('set_pin_msg') : t('locked_msg')}
                </p>

                <form onSubmit={handleUnlock} className="flex justify-center gap-4">
                    <input
                        type="password"
                        maxLength={6}
                        placeholder={isSettingPin ? t('new_pin_placeholder') : t('pin_placeholder')}
                        className="w-32 text-center text-2xl tracking-widest p-3 rounded-xl border border-neutral-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all placeholder-neutral-300 dark:placeholder-slate-600"
                        value={pin}
                        onChange={(e) => setPin(e.target.value)}
                        autoFocus
                    />
                    <button type="submit" className="bg-rose-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
                        {isSettingPin ? t('set_pin') : t('unlock')}
                    </button>
                </form>

                {!isSettingPin && (
                    <div className="mt-6">
                        <button
                            onClick={async () => {
                                const password = prompt("To reset your PIN, please enter your account login password:");
                                if (password) {
                                    try {
                                        // Verify identity by attempting to sign in
                                        const { error } = await signIn(currentUser.email, password);
                                        if (error) {
                                            alert("Incorrect password. Cannot reset PIN.");
                                        } else {
                                            // Identity verified
                                            if (window.confirm("Password verified. Reset PIN now?")) {
                                                // Reset in DB first to avoid race condition with auth state change re-fetching old PIN
                                                await setUserPin(currentUser.id, null);
                                                // Force re-check (will fetch null)
                                                checkPin();
                                                setPin('');
                                                alert("PIN has been reset. Please set a new one.");
                                            }
                                        }
                                    } catch (err) {
                                        console.error(err);
                                        alert("Authentication failed.");
                                    }
                                }
                            }}
                            className="text-xs text-neutral-400 dark:text-slate-500 hover:text-neutral-600 dark:hover:text-slate-300 underline transition-colors"
                        >
                            {t('forgot_pin')}
                        </button>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-8 border-t-4 border-rose-500 pt-8 max-w-5xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-rose-800 dark:text-rose-400 flex items-center gap-3">
                    <Unlock size={32} />
                    {t('secret_log')}
                </h1>
                <button onClick={() => setIsUnlocked(false)} className="text-sm text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200 underline">
                    {t('lock_again')}
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder={t('search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-white dark:bg-slate-800 text-neutral-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none transition-all placeholder-neutral-400 dark:placeholder-slate-500"
                />
                <div className="absolute left-3 top-3.5 text-neutral-400 dark:text-slate-500">
                    <Search size={18} />
                </div>
            </div>

            {/* Secret Folders Section */}
            <div className="flex items-center space-x-3 overflow-x-auto pb-4 scrollbar-hide">
                <button
                    onClick={() => setSelectedFolder('Uncategorized')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedFolder === 'Uncategorized'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-700'
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
                            ? 'bg-rose-600 text-white shadow-md'
                            : 'bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Folder size={18} />
                        <span>{folder.name}</span>
                        <button
                            onClick={(e) => handleDeleteFolder(folder.id, e)}
                            className="ml-2 opacity-0 group-hover:opacity-100 hover:text-rose-300 transition-opacity"
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={() => setSelectedFolder(null)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${selectedFolder === null
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-700'
                        }`}
                >
                    <Folder size={18} />
                    <span>All Secrets</span>
                </button>

                {showNewFolderInput ? (
                    <form onSubmit={handleCreateFolder} className="flex items-center space-x-2 bg-rose-50 dark:bg-slate-800 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50">
                        <input
                            autoFocus
                            type="text"
                            placeholder="Secret Folder"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 p-0 text-sm text-rose-800 dark:text-rose-200 w-32 placeholder-rose-400"
                        />
                        <button type="submit" className="text-rose-600 dark:text-rose-400">
                            <Plus size={18} />
                        </button>
                        <button type="button" onClick={() => setShowNewFolderInput(false)} className="text-rose-400 hover:text-rose-600">
                            <X size={18} />
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowNewFolderInput(true)}
                        className="flex items-center space-x-2 px-4 py-2 rounded-xl border border-dashed border-rose-300 dark:border-rose-700 text-rose-500 dark:text-rose-400 hover:border-rose-400 hover:text-rose-600 transition-all whitespace-nowrap"
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

            {loading && !entries.length && page === 0 ? <p className="text-neutral-500 dark:text-slate-400">Loading secrets...</p> : (
                <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {entries.filter(entry =>
                        (entry.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                        (entry.content?.toLowerCase() || '').includes(searchQuery.toLowerCase())
                    ).map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-rose-50/50 dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-rose-900/30 relative group flex flex-col h-full min-h-[250px]"
                        >

                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100 line-clamp-1" title={entry.title}>{entry.title}</h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-sm text-rose-400 dark:text-rose-300 font-medium">
                                            {entry.date ? format(entry.date.toDate(), 'PPP') : 'Just now'}
                                        </p>
                                        {entry.folder && (
                                            <span className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-300 px-2 py-0.5 rounded-full flex items-center gap-1 line-clamp-1 max-w-[100px]">
                                                <Folder size={10} />
                                                {entry.folder.name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={(e) => handleToggleFavorite(e, entry)}
                                        className={`p-1.5 rounded-full transition-colors ${entry.isFavorite ? 'text-amber-400 hover:text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-300 dark:text-rose-600 hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-slate-700'}`}
                                        title={entry.isFavorite ? "Remove from favorites" : "Add to favorites"}
                                    >
                                        <Star size={16} fill={entry.isFavorite ? "currentColor" : "none"} />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingEntry(entry);
                                        }}
                                        className="text-rose-300 hover:text-rose-600 p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Edit Secret"
                                    >
                                        <Edit2 size={16} />
                                    </button>

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(entry.id);
                                        }}
                                        className="text-rose-300 hover:text-rose-600 p-1.5 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div
                                onClick={() => toggleExpand(entry.id)}
                                className="whitespace-pre-wrap text-rose-900/80 dark:text-slate-300 leading-relaxed font-serif cursor-pointer flex-1"
                            >
                                <p className={expandedEntries.has(entry.id) ? '' : 'line-clamp-6'}>
                                    {entry.content}
                                </p>
                                {!expandedEntries.has(entry.id) && entry.content.length > 150 && (
                                    <span className="text-rose-500 text-sm font-medium hover:underline mt-1 block">Read more</span>
                                )}
                            </div>
                            {entry.imageUrl && (
                                <div className="mt-4 rounded-lg overflow-hidden h-40 w-full bg-rose-100 dark:bg-slate-900 shrink-0">
                                    <SecureImage path={entry.imageUrl} alt="Secret info" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity" />
                                </div>
                            )}
                        </motion.div>
                    ))}
                    {entries.length === 0 && <p className="text-center text-rose-400 dark:text-rose-500 py-10 col-span-full">{t('no_entries')}</p>}
                </div>
            )}

            {hasMore && !loading && entries.length > 0 && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={handleLoadMore}
                        className="bg-rose-50 dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-6 py-2 rounded-full border border-rose-200 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-slate-700 transition-colors shadow-sm"
                    >
                        Load More Secrets
                    </button>
                </div>
            )}
            {loading && page > 0 && (
                <div className="flex justify-center pt-6">
                    <p className="text-rose-400">Loading...</p>
                </div>
            )}
        </div>
    );
};

export default SecretLog;
