import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createProfile, getEmailByUsername } from '../lib/entryService';


import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState(''); // For signup confirmation
    const [username, setUsername] = useState('');
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        try {
            if (isLogin) {
                // Determine if input is email or username
                let loginEmail = email.trim();
                if (!loginEmail.includes('@')) {
                    // It's a username, fetch email
                    const { data, error } = await getEmailByUsername(loginEmail);
                    if (error || !data) throw new Error("Username not found");
                    loginEmail = data;
                }
                const { error } = await signIn(loginEmail, password);
                if (error) throw error;
                navigate('/');
            } else {
                // Sign Up
                // Pass username in metadata so the Trigger can pick it up
                const { data: authData, error } = await signUp(email.trim(), password, {
                    data: { username: username.trim() }
                });
                if (error) throw error;

                // Profile creation is now handled by Database Trigger 'on_auth_user_created'
                // No need to call createProfile manually

                setMessage("Check your email for the confirmation link!");
            }
        } catch (err) {
            let msg = err.message;
            if (msg.includes("Invalid login credentials")) {
                msg += ". Did you sign up with Google? Access via Google or reset your password.";
            }
            setError(msg);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-neutral-100/50 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300">
                <h2 className="text-3xl font-bold mb-6 text-center text-indigo-900 dark:text-white transition-colors">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
                {error && <p className="text-red-500 text-sm mb-4 bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-100 dark:border-red-900/30">{error}</p>}
                {message && <p className="text-green-600 dark:text-green-400 text-sm mb-4 bg-green-50 dark:bg-green-900/20 p-2 rounded border border-green-100 dark:border-green-900/30">{message}</p>}
                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-600 dark:text-slate-300 mb-1">Username</label>
                            <input
                                type="text"
                                className="w-full p-3 rounded-lg border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-neutral-400"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required={!isLogin}
                            />
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 dark:text-slate-300 mb-1">{isLogin ? "Email or Username" : "Email"}</label>
                        <input
                            type={isLogin ? "text" : "email"}
                            className="w-full p-3 rounded-lg border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-neutral-400"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-600 dark:text-slate-300 mb-1">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 rounded-lg border border-neutral-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-neutral-400"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <Link to="/forgot-password" onClick={() => { setError(''); setMessage(''); }} className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium transition-colors">
                            Forgot Password?
                        </Link>
                    </div>
                    <Button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white active:scale-[0.98] transition-all shadow-md hover:shadow-lg">
                        {isLogin ? 'Login' : 'Sign Up'}
                    </Button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-200 dark:border-slate-600"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white dark:bg-slate-800 text-neutral-500 dark:text-slate-400 transition-colors">Or continue with</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                const { error } = await signInWithGoogle();
                                if (error) throw error;
                            } catch (err) {
                                setError(err.message);
                            }
                        }}
                        className="w-full py-3 bg-white dark:bg-slate-700 border border-neutral-200 dark:border-slate-600 text-neutral-700 dark:text-white rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-600 font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                        Google
                    </button>
                </form>
                <p className="mt-6 text-center text-sm text-neutral-500 dark:text-slate-400">
                    {isLogin ? "Don't have an account? " : "Already have an account? "}
                    <button
                        onClick={() => { setIsLogin(!isLogin); setError(''); setMessage(''); }}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}
