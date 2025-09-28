// hooks/useAuth.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import {
    auth,
    googleProvider,
    facebookProvider,
    signInWithPopup,
    signOut,
} from '../components/firebase';
import { setPersistence, browserLocalPersistence, onAuthStateChanged } from 'firebase/auth';

const BACKEND_URL = import.meta.env.VITE_API_URL;

// ======================================================================
// 1. BUAT INSTANCE AXIOS KHUSUS DENGAN INTERCEPTOR
// ======================================================================
const api = axios.create({
    baseURL: BACKEND_URL,
    withCredentials: true, // PENTING: Untuk mengirim cookies (refresh token)
});

// Interceptor untuk menangani token yang kadaluarsa secara otomatis
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const isAuthError = error.response?.status === 401;
        const isExpiredToken = error.response?.data?.expired === true;
        const isRefreshTokenRequest = originalRequest.url.includes('/api/auth/refresh-token');

        // Jika error berasal dari token yang kadaluarsa DAN bukan dari permintaan refresh token itu sendiri
        if (isAuthError && isExpiredToken && !isRefreshTokenRequest) {
            console.warn('Access token expired. Attempting to refresh token...');
            try {
                // Memanggil endpoint refresh token
                const res = await api.post('/api/auth/refresh-token');

                // Dapatkan access token baru dan simpan di localStorage
                const newAccessToken = res.data.token;
                localStorage.setItem('authToken', newAccessToken);

                // Perbarui header Authorization untuk permintaan yang gagal
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

                // Coba ulang permintaan yang gagal dengan token baru
                return api(originalRequest);
            } catch (refreshError) {
                // Jika refresh token juga gagal atau kadaluarsa, log out user
                console.error('Refresh token failed. Logging out...');
                localStorage.removeItem('authToken');
                localStorage.removeItem('user');
                window.location.href = '/'; // Arahkan ke halaman utama atau login
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

const useAuth = ({ clearCart } = {}) => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- UI States for Modals/Forms ---
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [registerUsername, setRegisterUsername] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerError, setRegisterError] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    // --- Core Authentication State ---
    const [authToken, setAuthToken] = useState(() => localStorage.getItem('authToken'));
    const [user, setUser] = useState(() => {
        try {
            const storedUser = localStorage.getItem('user');
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error('useAuth: Failed to parse user from localStorage on initial load:', e);
            localStorage.removeItem('user');
            return null;
        }
    });

    const [isAuthReady, setIsAuthReady] = useState(false);
    const isAuthenticated = useMemo(() => !!authToken && !!user?.id, [authToken, user]);

    // --- Helper to update internal states and local storage ---
    const handleAuthSuccess = useCallback((token, userData) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthToken(token);
        setUser(userData);
        setIsLoading(false);
        setLoginError('');
        setRegisterError('');
        setIsLoginModalOpen(false);
        setIsRegisterModalOpen(false);
    }, []);

    const handleAuthFailure = useCallback((errorMsg) => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setAuthToken(null);
        setUser(null);
        setIsLoading(false);
        setLoginError(errorMsg);
        setRegisterError(errorMsg);
    }, []);

    // --- Modal Control Functions (using useCallback for stability) ---
    const closeLoginModal = useCallback(() => {
        setIsLoginModalOpen(false);
        setLoginEmail('');
        setLoginPassword('');
        setLoginError('');
    }, []);

    const openLoginModal = useCallback(() => {
        setIsLoginModalOpen(true);
        setIsRegisterModalOpen(false);
        setLoginError('');
    }, []);

    const closeRegisterModal = useCallback(() => {
        setIsRegisterModalOpen(false);
        setRegisterUsername('');
        setRegisterEmail('');
        setRegisterPassword('');
        setRegisterError('');
    }, []);

    const openRegisterModal = useCallback(() => {
        setIsRegisterModalOpen(true);
        setIsLoginModalOpen(false);
        setRegisterError('');
    }, []);


    // ======================================================================
    // Core Authentication Logic
    // ======================================================================
    useEffect(() => {
        const initAuth = async () => {
            try {
                await setPersistence(auth, browserLocalPersistence);
            } catch (error) {
                console.error("Error setting Firebase Auth persistence:", error.code, error.message);
            }

            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    try {
                        const response = await api.post(
                            '/api/auth/firebase/verify-firebase-user',
                            { firebaseUid: firebaseUser.uid },
                        );
                        const { token: backendToken, user: backendUser } = response.data;
                        handleAuthSuccess(backendToken, backendUser);
                    } catch (err) {
                        console.error('useAuth: Backend sync failed for Firebase user:', err.response?.data?.message || err.message);
                        await signOut(auth);
                        handleAuthFailure('Backend user not found or sync failed for Firebase account.');
                    }
                } else {
                    const storedToken = localStorage.getItem('authToken');
                    const storedUser = localStorage.getItem('user');

                    if (storedToken && storedUser) {
                        try {
                            setAuthToken(storedToken);
                            setUser(JSON.parse(storedUser));
                        } catch (e) {
                            console.error("useAuth: Failed to parse user from localStorage on onAuthStateChanged:", e);
                            handleAuthFailure('Local user data corrupted. Please login again.');
                        }
                    } else {
                        handleAuthFailure('No active session.');
                    }
                }
                setIsAuthReady(true);
                setIsLoading(false);
            });
            return () => unsubscribe();
        };
        initAuth();
    }, [handleAuthSuccess, handleAuthFailure]);

    useEffect(() => {
        const checkAuthChange = () => {
            const newToken = localStorage.getItem('authToken');
            const newUser = (() => {
                try {
                    const storedUser = localStorage.getItem('user');
                    return storedUser ? JSON.parse(storedUser) : null;
                } catch (e) {
                    console.error('useAuth: Failed to parse user from localStorage on storage event:', e);
                    return null;
                }
            })();
            if (newToken !== authToken) {
                setAuthToken(newToken);
            }
            if (JSON.stringify(newUser) !== JSON.stringify(user)) {
                setUser(newUser);
            }
        };
        window.addEventListener('storage', checkAuthChange);
        return () => {
            window.removeEventListener('storage', checkAuthChange);
        };
    }, [authToken, user]);

    // --- Authentication Submit Handlers ---
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setLoginError('');
        setIsLoading(true);
        try {
            // Menggunakan instance api yang baru
            const res = await api.post('/api/auth/login', {
                email: loginEmail,
                password: loginPassword,
            });
            const { token, user: userData } = res.data;
            handleAuthSuccess(token, userData);
            navigate(userData.role === 'admin' ? '/admin/dashboard' : '/');
        } catch (err) {
            const msg = err.response?.data?.message || 'Login failed. Check credentials.';
            setLoginError(msg);
            handleAuthFailure(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setRegisterError('');
        setIsLoading(true);
        try {
            const res = await api.post('/api/auth/register', {
                username: registerUsername,
                email: registerEmail,
                password: registerPassword,
            });

            // ✅ backend hanya return message sekarang
            console.log('Register success:', res.data.message);

            // Tutup modal & kasih feedback
            closeRegisterModal();
            alert(res.data.message || 'Registrasi berhasil. Silakan cek email untuk verifikasi.');

        } catch (err) {
            const msg = err.response?.data?.message || 'Registration failed';
            setRegisterError(msg);
            handleAuthFailure(msg);
        } finally {
            setIsLoading(false);
        }
    };


    const handleFirebaseAuth = async (provider, isRegister = false) => {
        setIsLoading(true);
        try {
            await setPersistence(auth, browserLocalPersistence);
            const result = await signInWithPopup(auth, provider);
            const idToken = await result.user.getIdToken();
            const firebaseUser = result.user;

            const usernameToSend = isRegister
                ? registerUsername || firebaseUser.displayName?.replace(/\s/g, '') || `user_${Date.now()}`
                : null;
            
            // Menggunakan instance api yang baru
            const res = await api.post(
                '/api/auth/firebase/auth',
                {
                    idToken,
                    username: usernameToSend,
                    profilePicture: firebaseUser.photoURL || '',
                }
            );
            handleAuthSuccess(res.data.token, res.data.user);
            navigate(res.data.user.role === 'admin' ? '/admin/dashboard' : '/');
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Authentication failed';
            if (isRegister) {
                setRegisterError(msg);
            } else {
                setLoginError(msg);
                if (err.code === 'auth/account-exists-with-different-credential' || msg.includes('User not found')) {
                    setRegisterEmail(err.customData?._tokenResponse?.email || '');
                    openRegisterModal();
                }
            }
            handleAuthFailure(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = useCallback(() => handleFirebaseAuth(googleProvider, false), [handleFirebaseAuth]);
    const handleFacebookLogin = useCallback(() => handleFirebaseAuth(facebookProvider, false), [handleFirebaseAuth]);
    const handleGoogleRegister = useCallback(() => handleFirebaseAuth(googleProvider, true), [handleFirebaseAuth]);
    const handleFacebookRegister = useCallback(() => handleFirebaseAuth(facebookProvider, true), [handleFirebaseAuth]);

    const handleRegisterClick = useCallback(() => {
        closeLoginModal();
        openRegisterModal();
    }, [closeLoginModal, openRegisterModal]);

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth); // Sign out from Firebase
        } catch (firebaseErr) {
            console.error('useAuth: Error signing out from Firebase:', firebaseErr);
        } finally {
            handleAuthFailure('Logout initiated');
            if (clearCart) clearCart();
            navigate('/', { replace: true });
        }
    }, [clearCart, handleAuthFailure, navigate]);

    const handleCheckoutSubmit = useCallback((details) => {
        console.log('[Checkout]', details);
    }, []);

    // --- Public API ---
    return {
        user,
        authToken,
        isAuthenticated,
        isAuthReady,
        isLoading,
        isLoginModalOpen,
        loginEmail,
        loginPassword,
        loginError,
        setLoginEmail,
        setLoginPassword,
        openLoginModal,
        closeLoginModal,
        isRegisterModalOpen,
        registerUsername,
        setRegisterUsername,
        registerEmail,
        setRegisterEmail,
        registerPassword,
        setRegisterPassword,
        registerError,
        openRegisterModal,
        closeRegisterModal,
        handleLoginSubmit,
        handleRegisterSubmit,
        handleGoogleLogin,
        handleFacebookLogin,
        handleGoogleRegister,
        handleFacebookRegister,
        handleRegisterClick,
        handleLogout,
        handleCheckoutSubmit,
        handleLogin: openLoginModal,
    };
};

export default useAuth;