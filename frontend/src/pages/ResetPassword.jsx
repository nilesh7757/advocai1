import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import toast from 'react-hot-toast';
import AuthBackground from '@/Components/AuthBackground';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [formData, setFormData] = useState({
    otp_code: '',
    new_password: '',
    confirm_password: ''
  });
  const [loading, setLoading] = useState(false);

  if (!email) {
    toast.error('No email provided for password reset. Please try again.');
    navigate('/forgot-password');
    return null;
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.new_password !== formData.confirm_password) {
      toast.error("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('api/auth/reset-password/', {
        email,
        otp_code: formData.otp_code,
        new_password: formData.new_password,
        confirm_password: formData.confirm_password
      });
      toast.success(response.data.message);
      navigate('/login');
    } catch (error) {
      console.error('Reset password error:', error);
      toast.error(error.response?.data?.error || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await axios.post('api/auth/forgot-password/', { email });
      toast.success(response.data.message);
    } catch (error) {
      console.error('Resend OTP error:', error);
      toast.error(error.response?.data?.error || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

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
            <span className="text-primary text-sm font-semibold">Password Reset</span>
          </div>
          <h1 className="text-4xl font-extrabold text-foreground">
            Reset Password
          </h1>
          <p className="text-muted-foreground text-sm">
            Enter the code sent to <span className="font-medium text-primary">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label htmlFor="otp_code" className="text-sm font-medium text-foreground">Reset Code</label>
            <input
              id="otp_code"
              name="otp_code"
              type="text"
              placeholder="000000"
              maxLength="6"
              required
              value={formData.otp_code}
              onChange={(e) => setFormData({...formData, otp_code: e.target.value.replace(/\D/g, '').slice(0, 6)})}
              disabled={loading}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-center tracking-widest"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="new_password" className="text-sm font-medium text-foreground">New Password</label>
            <input
              id="new_password"
              name="new_password"
              type="password"
              placeholder="Enter new password"
              required
              value={formData.new_password}
              onChange={handleInputChange}
              disabled={loading}
              className="w-full px-4 py-3 bg-background border border-input rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="confirm_password" className="text-sm font-medium text-foreground">Confirm Password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Confirm new password"
              required
              value={formData.confirm_password}
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
                Resetting...
              </>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Didn't receive the code?</p>
          <button
            onClick={handleResendOtp}
            disabled={loading}
            className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            Resend Code
          </button>
        </div>

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

export default ResetPassword;
