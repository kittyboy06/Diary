import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setMessage('');
            setError('');
            setLoading(true);
            const { error } = await resetPassword(email);
            if (error) throw error;
            setMessage('Check your inbox for password reset instructions');
        } catch (err) {
            setError('Failed to reset password: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 to-purple-100 p-4">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-neutral-800">Reset Password</h2>
                    <p className="text-neutral-500 mt-2">Enter your email to get back in</p>
                </div>

                {error && <div className="bg-red-100 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
                {message && <div className="bg-green-100 border border-green-200 text-green-600 px-4 py-3 rounded-xl mb-6 text-sm">{message}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-neutral-400" size={20} />
                            <input
                                type="email"
                                required
                                className="w-full pl-12 pr-4 py-3 rounded-xl border border-neutral-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 flex justify-center"
                    >
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center justify-center gap-2">
                        <ArrowLeft size={16} />
                        Back to Login
                    </Link>
                </div>
            </div>
        </div>
    );
}
