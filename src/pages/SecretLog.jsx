import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getEntries, deleteEntry, getUserPin, setUserPin } from '../lib/entryService'; // We will assume getEntries filters secret ones separately if parameterized
import { motion } from 'framer-motion';
import { Lock, Unlock, Trash2, Key } from 'lucide-react';
import { format } from 'date-fns';

const SecretLog = () => {
    const { currentUser, signIn } = useAuth();
    const { t } = useLanguage();
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [pin, setPin] = useState('');
    const [savedPin, setSavedPin] = useState(null); // Null means fetching or no PIN set
    const [isLoadingPin, setIsLoadingPin] = useState(true);
    const [isSettingPin, setIsSettingPin] = useState(false);

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(false);

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
                fetchSecretEntries();
                alert("PIN Set Successfully!");
            } catch (err) {
                console.error(err);
                alert("Failed to set PIN");
            }
        } else {
            // Verifying existing PIN
            if (pin === savedPin) {
                setIsUnlocked(true);
                fetchSecretEntries();
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

    const fetchSecretEntries = async () => {
        setLoading(true);
        // In a real app, use specific query or filter
        const all = await getEntries(currentUser.id, true);
        const secrets = all.filter(e => e.isSecret);
        setEntries(secrets);
        setLoading(false);
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
        <div className="space-y-8 border-t-4 border-rose-500 pt-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-rose-800 dark:text-rose-400 flex items-center gap-3">
                    <Unlock size={32} />
                    {t('secret_log')}
                </h1>
                <button onClick={() => setIsUnlocked(false)} className="text-sm text-neutral-500 dark:text-slate-400 hover:text-neutral-800 dark:hover:text-slate-200 underline">
                    {t('lock_again')}
                </button>
            </div>

            {loading ? <p className="text-neutral-500 dark:text-slate-400">Loading secrets...</p> : (
                <div className="grid gap-6">
                    {entries.map((entry, index) => (
                        <motion.div
                            key={entry.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-rose-50/50 dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-rose-100 dark:border-rose-900/30 relative group"
                        >
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleDelete(entry.id)} className="text-rose-400 hover:text-rose-600 p-2">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-rose-900 dark:text-rose-100">{entry.title}</h2>
                                    <p className="text-sm text-rose-400 dark:text-rose-300 font-medium">
                                        {entry.date ? format(entry.date.toDate(), 'PPP p') : 'Just now'}
                                    </p>
                                </div>
                            </div>
                            <p className="whitespace-pre-wrap text-rose-900/80 dark:text-slate-300 leading-relaxed font-serif">{entry.content}</p>
                            {entry.imageUrl && (
                                <img src={entry.imageUrl} alt="Secret info" className="mt-4 rounded-lg opacity-90 hover:opacity-100 transition-opacity" />
                            )}
                        </motion.div>
                    ))}
                    {entries.length === 0 && <p className="text-center text-rose-400 dark:text-rose-500 py-10">{t('no_entries')}</p>}
                </div>
            )}
        </div>
    );
};

export default SecretLog;
