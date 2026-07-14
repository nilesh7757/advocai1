import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { GoogleLoginButton } from '@/Components/ui/GoogleLoginButton';
import AuthBackground from '@/Components/AuthBackground';

const Login = () => {
  const navigate = useNavigate();
  const { login, setUser, setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      await login(formData.email.trim().toLowerCase(), formData.password);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (tokenData) => {
    setLoading(true);
    try {
      if (!tokenData || !tokenData.credential) {
        toast.error('Google authentication failed. Please try again.');
        return;
      }

      const response = await axios.post('api/auth/google/', { token: tokenData.credential });

      const { access, refresh } = response.data.tokens;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(response.data.user);
      setIsAuthenticated(true);

      toast.success(response.data.message || 'Login successful!');
      navigate('/');
    } catch (error) {
      console.error('Google login error:', error);

      if (error.response) {
        const errorMsg = error.response.data?.error
          || error.response.data?.details
          || error.response.data?.detail
          || 'Google login failed. Please try again.';
        toast.error(errorMsg);
      } else if (error.request) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = (error) => {
    console.error('Google OAuth error:', error);
    setLoading(false);

    if (error?.error === 'popup_closed_by_user') {
      toast.error('Google sign-in was cancelled.');
    } else if (error?.error === 'access_denied') {
      toast.error('Access denied. Please grant necessary permissions.');
    } else {
      toast.error('Google login failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <AuthBackground />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="absolute top-4 left-4 z-20 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-card hover:bg-muted text-muted-foreground border border-border transition-colors duration-150 text-sm font-medium"
      >
        <span className="text-lg leading-none">&larr;</span>
        Go back
      </button>

      <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-2xl shadow-2xl border border-border relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-block mb-2 px-4 py-1.5 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-primary text-sm font-semibold">Welcome Back</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Login
          </h1>
          <p className="text-muted-foreground text-sm">Enter your email below to login to your account</p>
        </div>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <GoogleLoginButton
            onSuccess={handleGoogleLogin}
            onError={handleGoogleError}
            text="Sign in with Google"
            disabled={loading}
          />
        ) : (
          <div className="text-center p-3 text-xs bg-muted text-muted-foreground border border-border rounded-xl" title="To enable, set VITE_GOOGLE_CLIENT_ID in your environment variables">
            Google Login is unavailable (Missing Configuration)
          </div>
        )}

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-4 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="m@example.com"
              required
              value={formData.email}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
              <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 hover:underline transition-colors">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                Logging in...
              </>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/signup" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
