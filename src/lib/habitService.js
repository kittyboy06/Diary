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

export const getHabitStats = async (userId, startDate, endDate, collectionId = 'all') => {
    // 1. Get relevant habits (IDs and Count)
    let query = supabase
        .from('user_habits')
        .select('id', { count: 'exact' })
        .eq('user_id', userId);

    if (collectionId !== 'all') {
        if (collectionId === 'unassigned') {
            query = query.is('collection_id', null);
        } else {
            query = query.eq('collection_id', collectionId);
        }
    }

    const { data: habits, count: totalHabits, error: habitsError } = await query;

    if (habitsError) throw habitsError;

    if (totalHabits === 0) return [];

    const habitIds = habits.map(h => h.id);

    // 2. Get completions in range for these habits
    const { data: completions, error: compError } = await supabase
        .from('habit_completions')
        .select('date')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .in('habit_id', habitIds);

    if (compError) throw compError;

    // 3. Aggregate by Date
    const statsMap = {};
    completions.forEach(c => {
        statsMap[c.date] = (statsMap[c.date] || 0) + 1;
    });

    // 4. Format for Chart
    return Object.entries(statsMap).map(([date, count]) => ({
        date,
        score: Math.round((count / totalHabits) * 100)
    }));
};

// --- Daily Metrics (Screen Time, etc.) ---

export const getDailyMetrics = async (userId, dateStr) => {
    // Returns metric record for a specific date
    const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .maybeSingle();

    if (error) throw error;
    return data;
};

export const getDailyMetricsRange = async (userId, startDate, endDate) => {
    // Returns metrics for a date range
    const { data, error } = await supabase
        .from('daily_metrics')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true });

    if (error) throw error;
    return data;
};

export const updateScreenTime = async (userId, dateStr, minutes) => {
    // Upsert logic
    const { data, error } = await supabase
        .from('daily_metrics')
        .upsert(
            { user_id: userId, date: dateStr, screen_time_minutes: minutes },
            { onConflict: 'user_id, date' }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
};
