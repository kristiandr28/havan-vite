import React, { useState } from 'react';
import axios from 'axios';
import { FcGoogle } from 'react-icons/fc';
import { FaFacebook } from 'react-icons/fa';
import { auth, googleProvider, facebookProvider, signInWithPopup } from '../components/firebase';
import { useLocation, useNavigate } from 'react-router-dom';

function Login({ setIsAuthenticated }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const BACKEND_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      console.log('Login.jsx: Submitting login:', { email, password });
      const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });
      console.log('Login.jsx: Login response:', response.data);
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      const from = location.state?.from || (response.data.user.role === 'admin' ? '/admin/dashboard' : '/');
      console.log('Login.jsx: Navigating to:', from);
      navigate(from);
    } catch (err) {
      console.error('Login.jsx: Login error:', err);
      // Periksa apakah error berasal dari backend dengan status 403 (Forbidden)
      if (err.response && err.response.status === 403) {
        // Tampilkan pesan spesifik untuk akun yang belum terverifikasi
        setError(err.response.data.message || 'Account not verified. Please check your email.');
      } else {
        // Tampilkan pesan error umum untuk kasus lainnya
        const errorMsg = err.response?.data.message || 'Login failed. Please check your credentials.';
        setError(errorMsg);
      }
    }
  };

  const handleGoogleLogin = async () => {
    // ... (kode untuk Google login tidak berubah)
    try {
      console.log('Login.jsx: Starting Google login');
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      console.log('Login.jsx: Google idToken:', idToken);
      const response = await axios.post(`${BACKEND_URL}/api/auth/firebase`, { idToken });
      console.log('Login.jsx: Firebase login response:', response.data);
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      const from = location.state?.from || (response.data.user.role === 'admin' ? '/admin/dashboard' : '/');
      console.log('Login.jsx: Navigating to:', from);
      navigate(from);
    } catch (err) {
      const errorMsg = err.message || 'Google login failed';
      console.error('Login.jsx: Google login error:', err);
      setError(errorMsg);
    }
  };

  const handleFacebookLogin = async () => {
    // ... (kode untuk Facebook login tidak berubah)
    try {
      console.log('Login.jsx: Starting Facebook login');
      const result = await signInWithPopup(auth, facebookProvider);
      const idToken = await result.user.getIdToken();
      console.log('Login.jsx: Facebook idToken:', idToken);
      const response = await axios.post(`${BACKEND_URL}/api/auth/firebase`, { idToken });
      console.log('Login.jsx: Firebase login response:', response.data);
      localStorage.setItem('authToken', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setIsAuthenticated(true);
      const from = location.state?.from || (response.data.user.role === 'admin' ? '/admin/dashboard' : '/');
      console.log('Login.jsx: Navigating to:', from);
      navigate(from);
    } catch (err) {
      const errorMsg = err.message || 'Facebook login failed';
      console.error('Login.jsx: Facebook login error:', err);
      setError(errorMsg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Sign in</h2>
          <p className="mt-2 text-sm text-gray-600">
            or{' '}
            <a href="/register" className="font-medium text-blue-600 hover:text-blue-500">
              create a new account
            </a>
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Oops!</strong>
            <span className="block sm:inline ml-2">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-full focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="password" className="sr-only">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-full focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Sign in
            </button>
          </div>

          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FcGoogle className="h-5 w-5 mr-2" />
              Sign in with Google
            </button>
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full flex items-center justify-center py-2 px-4 border border-gray-300 rounded-full shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaFacebook className="h-5 w-5 mr-2 text-blue-600" />
              Sign in with Facebook
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;