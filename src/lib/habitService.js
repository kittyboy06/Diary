import { supabase } from './supabase';
import { format } from 'date-fns';

export const getHabitLogs = async (userId, startDate, endDate) => {
    let query = supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: true });

    if (startDate) {
        query = query.gte('date', startDate);
    }
    if (endDate) {
        query = query.lte('date', endDate);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
};

export const logHabit = async (userId, date, habits) => {
    // Check if log exists for this date
    const { data: existing } = await supabase
        .from('habit_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

    if (existing) {
        // Update
        const { error } = await supabase
            .from('habit_logs')
            .update({ habits })
            .eq('id', existing.id);
        if (error) throw error;
    } else {
        // Insert
        const { error } = await supabase
            .from('habit_logs')
            .insert([{ user_id: userId, date, habits }]);
        if (error) throw error;
    }
};

export const getTodayHabits = async (userId) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data, error } = await supabase
        .from('habit_logs')
        .select('habits')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

    if (error) throw error;
    return data?.habits || null;
};
