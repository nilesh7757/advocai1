import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import AuthBackground from '@/Components/AuthBackground';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post('api/auth/forgot-password/', { email });
      toast.success(response.data.message);
      navigate('/reset-password', { state: { email } });
    } catch (error) {
      console.error('Forgot password error:', error);
      toast.error(error.response?.data?.error || 'Failed to send reset code.');
    } finally {
      setLoading(false);
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
            <span className="text-primary text-sm font-semibold">Password Recovery</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Forgot Password
          </h1>
          <p className="text-muted-foreground text-sm">Enter your email to receive a reset code</p>
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
                Sending...
              </>
            ) : (
              'Send Reset Code'
            )}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{" "}
          <Link to="/login" className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
