import { supabase } from './supabase';

const TABLE = 'entries';
const BUCKET = 'images';

export const createProfile = async (userId, username, email) => {
    const { data, error } = await supabase
        .from('profiles')
        .insert([{ id: userId, username, email }]);
    return { data, error };
};

export const getEmailByUsername = async (username) => {
    const { data, error } = await supabase.rpc('get_email_by_username', { p_username: username });
    return { data, error };
};

export const getProfile = async (userId) => {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
    return { data, error };
};

export const updateProfile = async (userId, updates) => {
    const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select();
    return { data, error };
};

export const uploadAvatar = async (file, userId) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

    return data.publicUrl;
};

export const addEntry = async (userId, entry) => {
    try {
        // entry has: title, content, imageUrl, isSecret, mood
        const dbEntry = {
            title: entry.title,
            content: entry.content,
            image_url: entry.imageUrl,      // Map camelCase to snake_case
            is_secret: entry.isSecret,      // Map camelCase to snake_case
            mood: entry.mood,
            user_id: userId,
            created_at: new Date().toISOString() // Standard renaming from 'date' to 'created_at' usually, but code used 'date'. Keeping 'date' or checking error?
            // Error didn't complain about 'date'. But Supabase defaults usually use created_at. 
            // Let's stick to what we know failed: imageUrl -> image_url.
            // Wait, if I change 'date' to 'created_at' I might break it if they actually have a 'date' column.
            // I will use 'date' if that wasn't the error, but standard is created_at.
            // Safest bet for 'date' is to leave it if it didn't error, 
            // OR checks generic error "Error adding document".
            // I'll stick to 'date' for now but comments suggest snake_case convention.
        };

        // Actually, let's map 'date' to 'created_at' if possible, but I don't want to guess.
        // I will map the known failures.

        const { data, error } = await supabase
            .from(TABLE)
            .insert([{
                title: entry.title,
                content: entry.content,
                image_url: entry.imageUrl,
                is_secret: entry.isSecret,
                mood: entry.mood,
                habits: entry.habits, // New field
                user_id: userId,
                date: new Date().toISOString()
            }])
            .select();

        if (error) throw error;
        return data[0].id;
    } catch (e) {
        console.error("Error adding document: ", e);
        throw e;
    }
};

export const getEntries = async (userId, includeSecret = false) => {
    try {
        let query = supabase
            .from(TABLE)
            .select('*')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        const { data, error } = await query;
        if (error) throw error;

        const entries = data.map(d => ({
            ...d,
            id: d.id,
            // Map back to camelCase for app consumption
            imageUrl: d.image_url,
            isSecret: d.is_secret,
            habits: d.habits || {}, // Default to empty object if null
            date: d.date ? { toDate: () => new Date(d.date) } : null,
        }));

        if (includeSecret) return entries;
        return entries.filter(e => !e.isSecret);
    } catch (e) {
        console.error("Error getting documents: ", e);
        throw e;
    }
};

export const deleteEntry = async (id) => {
    const { error } = await supabase
        .from(TABLE)
        .delete()
        .eq('id', id);
    if (error) throw error;
}

export const uploadImage = async (file, userId) => {
    if (!file) return null;
    const fileName = `${userId}/${Date.now()}_${file.name}`;

    const { error } = await supabase.storage
        .from(BUCKET)
        .upload(fileName, file);

    if (error) throw error;

    const { data } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(fileName);

    return data.publicUrl;
};

export const getEntryStats = async (userId) => {
    try {
        const { data, error } = await supabase
            .from(TABLE)
            .select('date')
            .eq('user_id', userId)
            .order('date', { ascending: false });

        if (error) throw error;

        const totalEntries = data.length;

        // Calculate Streak
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (data.length > 0) {
            // Check if there is an entry today or yesterday to keep streak alive
            const lastEntryDate = new Date(data[0].date);
            lastEntryDate.setHours(0, 0, 0, 0);

            const diffTime = Math.abs(today - lastEntryDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 1) {
                streak = 1;
                // Simple consecutive check (naive)
                for (let i = 0; i < data.length - 1; i++) {
                    const curr = new Date(data[i].date);
                    const next = new Date(data[i + 1].date);
                    curr.setHours(0, 0, 0, 0);
                    next.setHours(0, 0, 0, 0);

                    const d = (curr - next) / (1000 * 60 * 60 * 24);
                    if (d === 1) streak++;
                    else if (d > 1) break; // Gap found
                }
            }
        }

        return { totalEntries, streak };
    } catch (e) {
        console.error("Error getting stats:", e);
        return { totalEntries: 0, streak: 0 };
    }
};

export const getUserPin = async (userId) => {
    const { data, error } = await supabase
        .from('user_settings')
        .select('secret_pin')
        .eq('user_id', userId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
        console.error("Error fetching PIN:", error);
        return null; // Return null on error or not found
    }
    return data?.secret_pin || null;
};

export const setUserPin = async (userId, pin) => {
    const { error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, secret_pin: pin }); // Update or Insert

    if (error) throw error;
};

export const exportData = async (userId) => {
    try {
        // Fetch Profile
        const { data: profile } = await getProfile(userId);
        // Fetch Entries (including secret ones)
        const entries = await getEntries(userId, true);

        const exportObject = {
            user: profile,
            entries: entries,
            exportedAt: new Date().toISOString(),
            app: "Deep Dairy"
        };

        return exportObject;
    } catch (e) {
        console.error("Export failed:", e);
        throw e;
    }
};
