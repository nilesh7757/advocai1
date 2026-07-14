import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from '../api/axios';
import toast from 'react-hot-toast';
import { GoogleLoginButton } from '@/Components/ui/GoogleLoginButton';
import { useAuth } from '../context/AuthContext';
import AuthBackground from '@/Components/AuthBackground';

const Signup = () => {
  const navigate = useNavigate();
  const [accountType, setAccountType] = useState('client');
  const { setUser, setIsAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    password2: '',
    phone: ''
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

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, underscores, and hyphens';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = [];

      if (formData.password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(formData.password)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/[a-z]/.test(formData.password)) {
        passwordErrors.push('one lowercase letter');
      }
      if (!/[0-9]/.test(formData.password)) {
        passwordErrors.push('one number');
      }
      if (!/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(formData.password)) {
        passwordErrors.push('one special character');
      }

      if (passwordErrors.length > 0) {
        newErrors.password = `Password must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (formData.password !== formData.password2) {
      newErrors.password2 = 'Passwords do not match';
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
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const payload = {
        ...formData,
        role: accountType,
      };

      const response = await axios.post('/api/auth/signup/', payload);
      toast.success(response.data.message);

      if (response.data.requires_verification) {
        navigate('/verify-otp', { state: { email: response.data.email } });
      } else {
        navigate('/login');
      }
    } catch (error) {
      console.error('Signup error:', error);

      if (error.response) {
        const data = error.response.data;

        if (data && typeof data === 'object' && !data.error) {
          const fieldErrors = {};
          let hasFieldErrors = false;

          Object.keys(data).forEach(key => {
            const value = data[key];
            if (Array.isArray(value)) {
              fieldErrors[key] = value[0];
              hasFieldErrors = true;
            } else if (typeof value === 'string') {
              fieldErrors[key] = value;
              hasFieldErrors = true;
            }
          });

          if (hasFieldErrors) {
            setErrors(fieldErrors);
            return;
          }
        }

        let message = 'Signup failed. Please try again.';
        if (typeof data === 'string') {
          message = data;
        } else if (data?.error) {
          message = data.error;
        } else if (data?.detail) {
          message = data.detail;
        }

        toast.error(message);
      } else if (error.request) {
        toast.error('Unable to connect to server. Please check your internet connection.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async (tokenData) => {
    setLoading(true);
    try {
      if (!tokenData || !tokenData.credential) {
        toast.error('Google authentication failed. Please try again.');
        return;
      }

      const response = await axios.post('/api/auth/google/', { token: tokenData.credential });

      const { access, refresh } = response.data.tokens;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      setUser(response.data.user);
      setIsAuthenticated(true);

      toast.success(response.data.message || 'Signup successful!');
      navigate('/');
    } catch (error) {
      console.error('Google signup error:', error);

      if (error.response) {
        const errorMsg = error.response.data?.error
          || error.response.data?.details
          || error.response.data?.detail
          || 'Google signup failed. Please try again.';
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
    toast.error('Google signup failed. Please try again.');
    setLoading(false);
  };

  const inputClass = "w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden py-8">
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
            <span className="text-primary text-sm font-semibold">Get Started</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Create an account
          </h1>
          <p className="text-muted-foreground text-sm">Enter your information to create an account</p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setAccountType('client')}
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              accountType === 'client'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-foreground border-border hover:bg-muted'
            }`}
          >
            I'm a client
          </button>
          <button
            type="button"
            onClick={() => setAccountType('lawyer')}
            disabled={loading}
            className={`w-full py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              accountType === 'lawyer'
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-transparent text-foreground border-border hover:bg-muted'
            }`}
          >
            I'm a lawyer
          </button>
        </div>

        {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
          <GoogleLoginButton
            onSuccess={handleGoogleSignup}
            onError={handleGoogleError}
            text="Sign up with Google"
            disabled={loading}
          />
        ) : (
          <div className="text-center p-3 text-xs bg-muted text-muted-foreground border border-border rounded-xl" title="To enable, set VITE_GOOGLE_CLIENT_ID in your environment variables">
            Google Signup is unavailable (Missing Configuration)
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">Name</label>
              <input
                id="name"
                name="name"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={handleInputChange}
                disabled={loading}
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium text-foreground">Username</label>
              <input
                id="username"
                name="username"
                placeholder="johndoe"
                required
                value={formData.username}
                onChange={handleInputChange}
                disabled={loading}
                className={`${inputClass} ${errors.username ? 'border-destructive focus:ring-destructive' : ''}`}
              />
              {errors.username && (
                <p className="text-xs text-destructive mt-1">{errors.username}</p>
              )}
            </div>
          </div>

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
              className={`${inputClass} ${errors.email ? 'border-destructive focus:ring-destructive' : ''}`}
            />
            {errors.email && (
              <p className="text-xs text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
              required
              value={formData.password}
              onChange={handleInputChange}
              disabled={loading}
              className={`${inputClass} ${errors.password ? 'border-destructive focus:ring-destructive' : ''}`}
            />
            {errors.password && (
              <p className="text-xs text-destructive mt-1">{errors.password}</p>
            )}
            <div className="bg-muted/50 border border-border rounded-xl p-3 mt-2">
              <p className="text-xs font-semibold text-foreground mb-2">Password must contain:</p>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li className={`flex items-center gap-2 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{formData.password.length >= 8 ? '✓' : '○'}</span>
                  At least 8 characters
                </li>
                <li className={`flex items-center gap-2 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[A-Z]/.test(formData.password) ? '✓' : '○'}</span>
                  One uppercase letter (A-Z)
                </li>
                <li className={`flex items-center gap-2 ${/[a-z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[a-z]/.test(formData.password) ? '✓' : '○'}</span>
                  One lowercase letter (a-z)
                </li>
                <li className={`flex items-center gap-2 ${/[0-9]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[0-9]/.test(formData.password) ? '✓' : '○'}</span>
                  One number (0-9)
                </li>
                <li className={`flex items-center gap-2 ${/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                  <span>{/[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;/`~]/.test(formData.password) ? '✓' : '○'}</span>
                  One special character (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password2" className="text-sm font-medium text-foreground">Confirm Password</label>
            <input
              id="password2"
              name="password2"
              type="password"
              placeholder="Enter password"
              required
              value={formData.password2}
              onChange={handleInputChange}
              disabled={loading}
              className={`${inputClass} ${errors.password2 ? 'border-destructive focus:ring-destructive' : ''}`}
            />
            {errors.password2 && (
              <p className="text-xs text-destructive mt-1">{errors.password2}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone (optional)</label>
            <input
              id="phone"
              name="phone"
              placeholder="+91-XXXXXXXXXX"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={loading}
              className={inputClass}
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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
