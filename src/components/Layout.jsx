import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, PenTool, Book, Lock, LogOut, User, Moon, Sun, Menu, X, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';

const NavItem = ({ to, icon: Icon, label, onClick }) => {
    const location = useLocation();
    const isActive = location.pathname === to;

    return (
        <Link
            to={to}
            onClick={onClick}
            className={`flex items-center space-x-2 p-3 rounded-xl transition-all duration-200 ${isActive
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-neutral-600 dark:text-slate-300 hover:bg-neutral-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
        >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
        </Link>
    );
};

const Layout = () => {
    const { signOut } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    }

    const closeMobileMenu = () => setIsMobileMenuOpen(false);

    return (
        <div className="flex min-h-screen text-neutral-900 dark:text-slate-100 font-sans transition-colors duration-200">
            {/* Mobile Overlay Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                w-64 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-neutral-200/50 dark:border-slate-700/50 
                fixed h-full z-40 transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
                md:translate-x-0 md:sticky md:top-0 md:h-screen md:flex flex-col p-6
            `}>
                <div className="mb-10 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Book className="text-indigo-600 dark:text-indigo-400" size={32} />
                        <span className="text-2xl font-bold tracking-tight text-neutral-800 dark:text-white">{t('app_name')}</span>
                    </div>
                    {/* Close button for mobile */}
                    <button onClick={closeMobileMenu} className="md:hidden text-neutral-500 hover:text-neutral-700 dark:text-slate-400 dark:hover:text-slate-200">
                        <X size={24} />
                    </button>
                </div>

                <nav className="space-y-2 flex-1">
                    <NavItem to="/" icon={Home} label={t('dashboard')} onClick={closeMobileMenu} />
                    <NavItem to="/create-entry" icon={PenTool} label={t('new_entry')} onClick={closeMobileMenu} />
                    <NavItem to="/daily-log" icon={Book} label={t('daily_log')} onClick={closeMobileMenu} />
                    <NavItem to="/productivity" icon={Target} label="Productivity" onClick={closeMobileMenu} />
                    <NavItem to="/secret" icon={Lock} label={t('secret_log')} onClick={closeMobileMenu} />
                    <NavItem to="/profile" icon={User} label={t('profile')} onClick={closeMobileMenu} />
                </nav>

                <div className="mt-auto pt-6 border-t border-neutral-100 dark:border-slate-700 space-y-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center space-x-2 text-neutral-600 dark:text-slate-300 hover:bg-neutral-50 dark:hover:bg-slate-700 p-3 rounded-xl w-full transition-colors"
                    >
                        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        <span className="font-medium">{theme === 'light' ? t('dark_mode') : t('light_mode')}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center space-x-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 p-3 rounded-xl w-full transition-colors"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">{t('sign_out')}</span>
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <div className="md:hidden fixed w-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl z-20 border-b border-neutral-200/50 dark:border-slate-700/50 p-4 flex justify-between items-center transition-colors duration-300 top-0 left-0 right-0">
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsMobileMenuOpen(true)} className="text-neutral-700 dark:text-slate-200">
                        <Menu size={24} />
                    </button>
                    <div className="flex items-center space-x-2">
                        <Book className="text-indigo-600 dark:text-indigo-400" size={24} />
                        <span className="font-bold text-lg dark:text-white">{t('app_name')}</span>
                    </div>
                </div>
                {/* Theme Toggle in Mobile Header as well for convenience */}
                <button onClick={toggleTheme} className="p-2 text-neutral-600 dark:text-indigo-400">
                    {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 md:ml-0 p-6 md:p-12 overflow-auto relative z-0 w-full pt-20 md:pt-12">
                <div className="max-w-5xl mx-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default Layout;
