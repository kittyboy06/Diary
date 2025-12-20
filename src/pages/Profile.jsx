import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, uploadAvatar, exportData } from '../lib/entryService';
import { User, Mail, Phone, Camera, Save, X, Download } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import Button from '../components/Button';

export default function Profile() {
    const { currentUser } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const fileInputRef = useRef(null);

    const [profile, setProfile] = useState({
        username: '',
        email: '',
        gender: '',
        phone: '',
        avatar_url: null,
    });

    // Fallback logic for Avatar: Profile DB -> Google Metadata -> Placeholder
    const displayAvatar = profile.avatar_url || currentUser?.user_metadata?.avatar_url || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

    useEffect(() => {
        if (currentUser) {
            loadProfile();
        }
    }, [currentUser]);

    const loadProfile = async () => {
        try {
            const { data, error } = await getProfile(currentUser.id);
            if (error && error.code !== 'PGRST116') {
                console.error('Error loading profile:', error);
            }
            if (data) {
                setProfile({
                    username: data.username || '',
                    email: currentUser.email, // Email from Auth is source of truth
                    gender: data.gender || '',
                    phone: data.phone || '',
                    avatar_url: data.avatar_url || null,
                });
            } else {
                // Initialize with Google data if no profile exists (edge case)
                setProfile(prev => ({
                    ...prev,
                    email: currentUser.email,
                    username: currentUser.user_metadata?.username || currentUser.user_metadata?.full_name || ''
                }));
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
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

    if (loading) return <div className="p-8 text-center text-neutral-500">{t('loading_profile')}</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-neutral-100 dark:border-slate-700 overflow-hidden transition-colors">
                {/* Header / Cover Area - could be a gradient or image */}
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
                </div>
            </div>
        </div>
    );
}
