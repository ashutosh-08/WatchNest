import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/;

export default function Register() {
  const navigate = useNavigate();
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    avatar: null,
  });
  const [localError, setLocalError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const fullName = formData.fullName.trim();
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!fullName || !email || !password || !confirmPassword) {
      setLocalError('Please fill all required fields');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setLocalError('Password must be 6+ chars with uppercase, lowercase, and number');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await register(
        fullName,
        email,
        password,
        formData.avatar
      );
      navigate('/login');
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="auth-cinematic-shell flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,10,12,0.82)_0%,rgba(12,16,20,0.72)_50%,rgba(8,10,12,0.82)_100%)]" />

      <div className="relative z-10 w-full max-w-lg auth-glass-card p-8">
        <div className="text-center mb-8">
          <p className="text-xs tracking-[0.18em] text-[#00F0FF] uppercase">Cinematic Portal</p>
          <h1 className="text-3xl md:text-[2rem] font-sora font-bold text-white mt-2">Join the WatchNest.</h1>
          <p className="text-white/65 mt-2 text-sm">Create your account and step into the stream universe.</p>
        </div>

        {(error || localError) && (
          <div className="bg-[#FF3E3E]/12 border border-[#FF3E3E]/40 text-[#ffc6c6] px-4 py-3 rounded-xl mb-4 text-sm">
            {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <label className="block text-xs font-semibold text-white/85 mb-2 uppercase tracking-[0.1em]">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="John Doe"
              required
              className="auth-input focus:outline-none peer"
            />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 bg-[#39FF14] transition-all duration-300 peer-focus:w-full" />
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-white/85 mb-2 uppercase tracking-[0.1em]">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              className="auth-input focus:outline-none peer"
            />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 bg-[#39FF14] transition-all duration-300 peer-focus:w-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-white/85 mb-2 uppercase tracking-[0.1em]">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="********"
                required
                minLength={6}
                className="auth-input focus:outline-none peer"
              />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 bg-[#39FF14] transition-all duration-300 peer-focus:w-full" />
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-white/85 mb-2 uppercase tracking-[0.1em]">Confirm</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="********"
                required
                className="auth-input focus:outline-none peer"
              />
              <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 bg-[#39FF14] transition-all duration-300 peer-focus:w-full" />
            </div>
          </div>

          <div className="relative">
            <label className="block text-xs font-semibold text-white/85 mb-2 uppercase tracking-[0.1em]">Profile Image (Optional)</label>
            <input
              type="file"
              name="avatar"
              onChange={handleChange}
              accept="image/*"
              className="auth-input file:mr-4 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:bg-[#00F0FF] file:text-black file:font-semibold file:cursor-pointer"
            />
            <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 bg-[#39FF14] transition-all duration-300 peer-focus:w-full" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#39FF14] text-black py-2.5 rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? 'Creating account...' : 'Create WatchNest Account'}
          </button>
        </form>

        <p className="text-center text-sm text-white/75 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-[#00F0FF] font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
