import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import UpdatePassword from './pages/UpdatePassword';

import CreateEntry from './pages/CreateEntry';
import DailyLog from './pages/DailyLog';
import SecretLog from './pages/SecretLog';
import Profile from './pages/Profile';

function App() {
    return (
        <Router>
            <AuthProvider>
                <ThemeProvider>
                    <LanguageProvider>
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
                                <Route path="secret-log" element={<SecretLog />} />
                                <Route path="profile" element={<Profile />} />
                            </Route>
                        </Routes>
                    </LanguageProvider>
                </ThemeProvider>
            </AuthProvider>
        </Router >
    );
}

export default App;
