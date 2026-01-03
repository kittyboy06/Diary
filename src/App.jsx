import React, { Suspense, lazy } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import { Loader } from 'lucide-react';

// Lazy Load Pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const UpdatePassword = lazy(() => import('./pages/UpdatePassword'));
const CreateEntry = lazy(() => import('./pages/CreateEntry'));
const DailyLog = lazy(() => import('./pages/DailyLog'));
const SecretLog = lazy(() => import('./pages/SecretLog'));
const Profile = lazy(() => import('./pages/Profile'));
const Productivity = lazy(() => import('./pages/Productivity'));
const ProductivityAnalytics = lazy(() => import('./pages/ProductivityAnalytics'));
const Todo = lazy(() => import('./pages/Todo'));

const PageLoader = () => (
    <div className="flex h-screen w-full items-center justify-center bg-white dark:bg-slate-900">
        <Loader className="animate-spin text-indigo-600 dark:text-indigo-400" size={40} />
    </div>
);

function App() {
    return (
        <Router>
            <Toaster position="top-center" richColors />
            <AuthProvider>
                <ThemeProvider>
                    <LanguageProvider>
                        <Suspense fallback={<PageLoader />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/update-password" element={<UpdatePassword />} />
                                <Route path="/" element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }>
                                    <Route index element={<Home />} />
                                    <Route path="create-entry" element={<CreateEntry />} />
                                    <Route path="daily-log" element={<DailyLog />} />
                                    <Route path="secret" element={<SecretLog />} />
                                    <Route path="productivity" element={<Productivity />} />
                                    <Route path="productivity/analytics" element={<ProductivityAnalytics />} />
                                    <Route path="todo" element={<Todo />} />
                                    <Route path="profile" element={<Profile />} />
                                </Route>
                            </Routes>
                        </Suspense>
                    </LanguageProvider>
                </ThemeProvider>
            </AuthProvider>
        </Router >
    );
}

export default App;
