import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createProfile, getEmailByUsername } from '../lib/entryService';
import { toast } from 'sonner';

import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';

export default function Login() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [username, setUsername] = useState('');
    const { signIn, signUp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleAuth = async (e) => {
        e.preventDefault();
        try {
            if (isLogin) {
                // Determine if input is email or username
                let loginEmail = email.trim();
                let isUsername = !loginEmail.includes('@');

                const loginPromise = async () => {
                    if (isUsername) {
                        const { data, error } = await getEmailByUsername(loginEmail);
                        if (error || !data) throw new Error("Username not found");
                        loginEmail = data;
                    }
                    const { error } = await signIn(loginEmail, password);
                    if (error) throw error;
                };

                await toast.promise(loginPromise(), {
                    loading: 'Logging in...',
                    success: () => {
                        navigate('/');
                        return 'Welcome back!';
                    },
                    error: (err) => {
                        let msg = err.message;
                        if (msg.includes("Invalid login credentials")) {
                            msg += ". Did you sign up with Google?";
                        }
                        return msg;
                    }
                });

            } else {
                // Sign Up
                const signUpPromise = async () => {
                    const { data: authData, error } = await signUp(email.trim(), password, {
                        data: { username: username.trim() }
                    });
                    if (error) throw error;
                    // Profile creation is handled by DB Trigger
                };

                await toast.promise(signUpPromise(), {
                    loading: 'Creating account...',
                    success: 'Check your email for the confirmation link!',
                    error: (err) => err.message
                });
            }
        } catch (err) {
            // Error handled by toast.promise
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl w-full max-w-md border border-neutral-100/50 dark:border-slate-700 backdrop-blur-sm transition-colors duration-300">
                <h2 className="text-3xl font-bold mb-6 text-center text-indigo-900 dark:text-white transition-colors">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>
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
                        onClick={() => {
                            const googleLoginPromise = async () => {
                                const { error } = await signInWithGoogle();
                                if (error) throw error;
                            };

                            toast.promise(googleLoginPromise(), {
                                loading: 'Redirecting to Google...',
                                error: (err) => err.message
                            });
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
                        onClick={() => { setIsLogin(!isLogin); }}
                        className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
                    >
                        {isLogin ? 'Sign Up' : 'Login'}
                    </button>
                </p>
            </div>
        </div>
    );
}
