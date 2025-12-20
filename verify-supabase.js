import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) env[key.trim()] = value.trim();
});

const url = env['VITE_SUPABASE_URL'];
const key = env['VITE_SUPABASE_ANON_KEY'];

if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
    process.exit(1);
}

console.log('Connecting to Supabase at:', url);

const supabase = createClient(url, key);

async function test() {
    const email = `verify_${Date.now()}@example.com`;
    const password = 'TestPassword123!';

    console.log(`Attempting to sign up temp user: ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
    });

    if (authError) {
        console.error('Auth SignUp Failed:', authError.message);
        // Fallback: If sign up fails (e.g. email confirm required), we might not be able to proceed with DB operations if RLS assumes authenticated user.
        // But we check what we got.
        return;
    }

    const user = authData.user;
    if (!user) {
        console.error('Auth SignUp succeded but no user returned (maybe email confirmation required?)');
        return;
    }
    console.log('Auth SignUp Success. User ID:', user.id);

    // Need a session for RLS usually, but the client handles it if we used signUp?
    // Actually createClient persists session in memory by default for node? 
    // Yes, but let's be sure.

    console.log('Attempting to insert test entry...');
    const testEntry = {
        title: 'Verification Test',
        content: 'This is a test entry to verify Supabase connection.',
        user_id: user.id,
        date: new Date().toISOString(),
        isSecret: false,
        mood: 'testing'
    };

    const { data: insertData, error: insertError } = await supabase
        .from('entries')
        .insert([testEntry])
        .select();

    if (insertError) {
        console.error('Insert Failed:', insertError.message);
        console.error('Details:', insertError);
        return;
    }
    console.log('Insert Success:', insertData);

    console.log('Attempting to fetch test entry...');
    const { data: fetchData, error: fetchError } = await supabase
        .from('entries')
        .select('*')
        .eq('user_id', user.id);

    if (fetchError) {
        console.error('Fetch Failed:', fetchError.message);
        return;
    }
    console.log('Fetch Success. Count:', fetchData.length);
    console.log('Data:', fetchData);

    // Cleanup Entry
    console.log('Cleaning up test entry...');
    const { error: deleteError } = await supabase
        .from('entries')
        .delete()
        .eq('id', insertData[0].id);

    if (deleteError) {
        console.error('Cleanup Failed:', deleteError.message);
    } else {
        console.log('Cleanup Success');
    }
}

test();
