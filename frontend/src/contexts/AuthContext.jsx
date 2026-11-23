import { createContext, useContext, useState } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const getStoredUser = () => {
    try {
        const savedUser =
            localStorage.getItem('user') ||
            sessionStorage.getItem('user');

        return savedUser ? JSON.parse(savedUser) : null;
    } catch {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
        return null;
    }
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(getStoredUser);
    const [loading, setLoading] = useState(false);

    const clearStorage = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
    };

    const login = async (username, password, rememberMe) => {
        setLoading(true);

        try {
            const response = await api.post('/auth/login', {
                username,
                password,
            });

            const { token, user: userData } = response.data;

            clearStorage();

            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem('token', token);
            storage.setItem('user', JSON.stringify(userData));

            setUser(userData);

            return {
                success: true,
                user: userData,
            };
        } catch (error) {
            return {
                success: false,
                message:
                    error.response?.data?.message ||
                    'Tidak dapat terhubung ke server.',
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        clearStorage();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth harus digunakan di dalam AuthProvider');
    }

    return context;
};