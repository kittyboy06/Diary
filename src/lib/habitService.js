import { supabase } from './supabase';

// --- New Features (Productivity Uplift) ---

export const createHabit = async (userId, name, targetDays, color, collectionId = null) => {
    const { data, error } = await supabase
        .from('user_habits')
        .insert([{ user_id: userId, name, target_days: targetDays, color, collection_id: collectionId }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateHabit = async (habitId, updates) => {
    // updates: { name, target_days, color, collection_id }
    const { data, error } = await supabase
        .from('user_habits')
        .update(updates)
        .eq('id', habitId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteHabit = async (habitId) => {
    const { error } = await supabase
        .from('user_habits')
        .delete()
        .eq('id', habitId);

    if (error) throw error;
};

export const getHabits = async (userId) => {
    const { data, error } = await supabase
        .from('user_habits')
        .select(`
            *,
            habit_collections (
                id,
                name
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

// --- Collections Management ---

export const getCollections = async (userId) => {
    const { data, error } = await supabase
        .from('habit_collections')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const createCollection = async (userId, name) => {
    const { data, error } = await supabase
        .from('habit_collections')
        .insert([{ user_id: userId, name }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCollection = async (collectionId) => {
    const { error } = await supabase
        .from('habit_collections')
        .delete()
        .eq('id', collectionId);

    if (error) throw error;
};

export const toggleHabitCompletion = async (userId, habitId, date) => {
    // Check if completion exists
    const { data: existing } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', habitId)
        .eq('date', date)
        .maybeSingle();

    if (existing) {
        // Delete (Uncheck)
        const { error } = await supabase
            .from('habit_completions')
            .delete()
            .eq('id', existing.id);
        if (error) throw error;
        return false; // Not completed
    } else {
        // Insert (Check)
        const { error } = await supabase
            .from('habit_completions')
            .insert([{ user_id: userId, habit_id: habitId, date }]);
        if (error) throw error;
        return true; // Completed
    }
};

export const getHabitCompletions = async (userId, startDate, endDate) => {
    // Returns list of completion records
    const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) throw error;
    return data;
};

export const getHabitStats = async (userId, startDate, endDate) => {
    // 1. Get total number of active habits
    const { count: totalHabits, error: countError } = await supabase
        .from('user_habits')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (countError) throw countError;

    if (totalHabits === 0) return [];

    // 2. Get completions in range
    const { data: completions, error: compError } = await supabase
        .from('habit_completions')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate);

    if (compError) throw compError;

    // 3. Aggregate by Date
    const statsMap = {};
    completions.forEach(c => {
        statsMap[c.date] = (statsMap[c.date] || 0) + 1;
    });

    // 4. Format for Chart
    // We expect the caller (Home.jsx) to handle the date iteration to fill gaps if needed, 
    // or we can return a map. Let's return a map for efficient lookups.
    return Object.entries(statsMap).map(([date, count]) => ({
        date,
        score: Math.round((count / totalHabits) * 100)
    }));
};
