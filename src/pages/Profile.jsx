import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Profile() {
    // ...
    const [moodStats, setMoodStats] = useState({});
    const [habitStats, setHabitStats] = useState([]);

    // ...

    useEffect(() => {
        if (currentUser) {
            loadProfile();
            calculateStats();
        }
    }, [currentUser]);

    // ...

    const calculateStats = async () => {
        try {
            const entries = await getEntries(currentUser.id, true);

            // Mood Stats
            const mStats = {};
            entries.forEach(e => {
                if (e.mood) {
                    const m = e.mood.toLowerCase();
                    mStats[m] = (mStats[m] || 0) + 1;
                }
            });
            setMoodStats(mStats);

            // Habit Stats
            const hStats = { exercise: 0, water: 0, learning: 0 };
            entries.forEach(e => {
                if (e.habits) {
                    if (e.habits.exercise) hStats.exercise++;
                    if (e.habits.water) hStats.water++;
                    if (e.habits.learning) hStats.learning++;
                }
            });

            const chartData = [
                { name: 'Exercise', count: hStats.exercise, fill: '#818cf8' },
                { name: 'Water', count: hStats.water, fill: '#60a5fa' },
                { name: 'Learning', count: hStats.learning, fill: '#f472b6' },
            ];
            setHabitStats(chartData);

        } catch (e) {
            console.error("Error calculating stats", e);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const updates = {
                username: profile.username,
                gender: profile.gender,
                phone: profile.phone,
                updated_at: new Date(),
            };
            const { error } = await updateProfile(currentUser.id, updates);
            if (error) throw error;
            setIsEditing(false);
            alert(t('profile_updated'));
        } catch (error) {
            alert(t('profile_error') + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setSaving(true);
            const publicUrl = await uploadAvatar(file, currentUser.id);
            if (publicUrl) {
                // Update DB with new avatar URL immediately
                const { error } = await updateProfile(currentUser.id, { avatar_url: publicUrl });
                if (error) throw error;

                setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
            }
        } catch (error) {
            alert(t('avatar_error') + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleExport = async () => {
        try {
            const data = await exportData(currentUser.id);
            if (!data) return;

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `diary_export_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("Failed to export data.");
        }
    };

    const MOOD_EMOJIS = {
        'happy': '😃',
        'neutral': '😐',
        'sad': '😔',
        'angry': '😡',
        'excited': '🤩',
        'calm': '😌',
        'anxious': '😰'
    };

    if (loading) return <div className="p-8 text-center text-neutral-500">{t('loading_profile')}</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700 overflow-hidden transition-colors">
                {/* Header / Cover Area */}
                <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-700">
                                <img src={displayAvatar} alt="Profile" className="w-full h-full object-cover" />
                            </div>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-md text-neutral-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors border border-neutral-100 dark:border-slate-600"
                                title={t('change_avatar')}
                            >
                                <Camera size={16} />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleAvatarUpload}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>

                        <div className="mb-2">
                            {!isEditing ? (
                                <Button onClick={() => setIsEditing(true)} className="bg-indigo-600 text-white hover:bg-indigo-700 shadow-md py-2 px-6 rounded-xl font-medium transition-all">
                                    {t('edit_profile')}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <button onClick={() => setIsEditing(false)} className="p-2 text-neutral-500 dark:text-slate-400 hover:bg-neutral-50 dark:hover:bg-slate-700 rounded-lg border border-transparent hover:border-neutral-200 dark:hover:border-slate-600">
                                        <X size={20} />
                                    </button>
                                    <Button onClick={handleSave} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 py-2 px-6 text-white shadow-md rounded-xl">
                                        {saving ? t('saving') : <><Save size={18} className="mr-2" /> {t('save_changes')}</>}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h1 className="text-2xl font-bold text-neutral-800 dark:text-white">{profile.username || 'User'}</h1>
                            <p className="text-neutral-500 dark:text-slate-400 flex items-center gap-1.5 text-sm mt-1">
                                <Mail size={14} /> {profile.email}
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 pt-6 border-t border-neutral-100 dark:border-slate-700">
                            {/* Username Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-slate-500">{t('username_label')}</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={profile.username}
                                        onChange={e => setProfile({ ...profile, username: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none transition-all font-medium text-neutral-700 dark:text-slate-200"
                                    />
                                ) : (
                                    <div className="p-3 bg-neutral-50 dark:bg-slate-900 rounded-xl text-neutral-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                        <User size={18} className="text-neutral-400 dark:text-slate-500" />
                                        {profile.username || '-'}
                                    </div>
                                )}
                            </div>

                            {/* Gender Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-slate-500">{t('gender_label')}</label>
                                {isEditing ? (
                                    <select
                                        value={profile.gender}
                                        onChange={e => setProfile({ ...profile, gender: e.target.value })}
                                        className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none transition-all font-medium text-neutral-700 dark:text-slate-200"
                                    >
                                        <option value="">{t('select_gender')}</option>
                                        <option value="Male">{t('male')}</option>
                                        <option value="Female">{t('female')}</option>
                                        <option value="Other">{t('other')}</option>
                                    </select>
                                ) : (
                                    <div className="p-3 bg-neutral-50 dark:bg-slate-900 rounded-xl text-neutral-700 dark:text-slate-300 font-medium">
                                        {profile.gender || '-'}
                                    </div>
                                )}
                            </div>

                            {/* Phone Field */}
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-400 dark:text-slate-500">{t('phone_label')}</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={profile.phone}
                                        onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                        placeholder="+1 234 567 890"
                                        className="w-full p-3 rounded-xl bg-neutral-50 dark:bg-slate-900 border-transparent focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/50 outline-none transition-all font-medium text-neutral-700 dark:text-slate-200"
                                    />
                                ) : (
                                    <div className="p-3 bg-neutral-50 dark:bg-slate-900 rounded-xl text-neutral-700 dark:text-slate-300 font-medium flex items-center gap-2">
                                        <Phone size={18} className="text-neutral-400 dark:text-slate-500" />
                                        {profile.phone || '-'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Mood Breakdown */}
                    <div className="pt-6 border-t border-neutral-100 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">{t('mood_analytics') || "Mood Analytics"}</h3>
                        <div className="flex flex-wrap gap-4">
                            {Object.entries(moodStats).length > 0 ? (
                                Object.entries(moodStats).map(([mood, count]) => (
                                    <div key={mood} className="flex items-center gap-2 bg-neutral-50 dark:bg-slate-900 px-4 py-2 rounded-xl">
                                        <span className="text-2xl">{MOOD_EMOJIS[mood] || '❓'}</span>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-medium text-neutral-500 dark:text-slate-400 capitalize">{mood}</span>
                                            <span className="text-lg font-bold text-neutral-800 dark:text-white">{count}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-neutral-400 dark:text-slate-500 italic">No mood data yet.</p>
                            )}
                        </div>
                    </div>

                    {/* Actions Area */}
                    <div className="pt-6 border-t border-neutral-100 dark:border-slate-700 space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('language')}</h3>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-neutral-50 dark:bg-slate-700 text-neutral-700 dark:text-slate-200 border border-neutral-200 dark:border-slate-600 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="en">English</option>
                                <option value="ta">தமிழ் (Tamil)</option>
                                <option value="ml">മലയാളം (Malayalam)</option>
                                <option value="te">తెలుగు (Telugu)</option>
                                <option value="kn">ಕನ್ನಡ (Kannada)</option>
                            </select>
                        </div>

                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('account_actions')}</h3>
                        <Button
                            onClick={handleExport}
                            className="w-full sm:w-auto bg-neutral-50 dark:bg-slate-700 text-neutral-700 dark:text-slate-200 hover:bg-neutral-100 dark:hover:bg-slate-600 hover:text-indigo-600 dark:hover:text-indigo-400 border border-neutral-200 dark:border-slate-600 py-2.5 px-4 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <Download size={18} />
                            {t('export_data')}
                        </Button>
                    </div>

                    {/* Habit Analytics */}
                    <div className="pt-6 border-t border-neutral-100 dark:border-slate-700">
                        <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-4">Habit Consistency</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={habitStats}>
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis hide />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                                        cursor={{ fill: 'transparent' }}
                                    />
                                    <Bar dataKey="count" radius={[8, 8, 8, 8]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
