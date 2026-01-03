import { supabase } from './supabase';

export const getTodos = async (userId, folderId = 'all') => {
    let query = supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (folderId !== 'all') {
        if (folderId === 'unassigned') {
            query = query.is('folder_id', null);
        } else {
            query = query.eq('folder_id', folderId);
        }
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
};

export const createTodo = async (userId, text, deadline = null, folderId = null) => {
    const { data, error } = await supabase
        .from('todos')
        .insert([{ user_id: userId, text, completed: false, deadline, folder_id: folderId }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateTodo = async (todoId, updates) => {
    const { data, error } = await supabase
        .from('todos')
        .update(updates)
        .eq('id', todoId)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteTodo = async (todoId) => {
    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', todoId);

    if (error) throw error;
};

export const getUpcomingTodos = async (userId, limit = 5) => {
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', userId)
        .eq('completed', false)
        .not('deadline', 'is', null)
        .gte('deadline', new Date().toISOString()) // Only future or today
        .order('deadline', { ascending: true })
        .limit(limit);

    if (error) throw error;
    if (error) throw error;
    return data;
};

// --- Folder Management ---

export const getFolders = async (userId) => {
    const { data, error } = await supabase
        .from('todo_folders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

export const createFolder = async (userId, name) => {
    const { data, error } = await supabase
        .from('todo_folders')
        .insert([{ user_id: userId, name }])
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteFolder = async (folderId) => {
    const { error } = await supabase
        .from('todo_folders')
        .delete()
        .eq('id', folderId);

    if (error) throw error;
};
