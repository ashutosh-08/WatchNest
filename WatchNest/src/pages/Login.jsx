import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Login() {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [localError, setLocalError] = useState('');
  const [isDissolving, setIsDissolving] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setLocalError('Please fill all fields');
      return;
    }

    if (!EMAIL_REGEX.test(email)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      await login(email, password);
      setIsDissolving(true);
      window.setTimeout(() => {
        navigate('/');
      }, 760);
    } catch (err) {
      setLocalError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="auth-cinematic-shell flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(8,10,12,0.82)_0%,rgba(12,16,20,0.72)_50%,rgba(8,10,12,0.82)_100%)]" />

      <div
        className={`relative z-10 w-full max-w-md auth-glass-card p-8 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isDissolving ? 'scale-[5.5] opacity-0 blur-sm' : 'scale-100 opacity-100'
        }`}
      >
        <div className={`transition-all duration-500 ${isDissolving ? 'opacity-0 translate-y-3' : 'opacity-100'}`}>
          <div className="text-center mb-8">
            <p className="text-xs tracking-[0.18em] text-[#00F0FF] uppercase">Cinematic Portal</p>
            <h1 className="text-3xl md:text-[2rem] font-sora font-bold text-white mt-2">Welcome Back to the Nest.</h1>
            <p className="text-white/65 mt-2 text-sm">Step in and continue your premium stream session.</p>
          </div>

          {(error || localError) && (
            <div className="bg-[#FF3E3E]/12 border border-[#FF3E3E]/40 text-[#ffc6c6] px-4 py-3 rounded-xl mb-4 text-sm">
              {error || localError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
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

            <button
              type="submit"
              disabled={loading || isDissolving}
              className="w-full bg-[#39FF14] text-black py-2.5 rounded-xl font-semibold hover:brightness-110 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : isDissolving ? 'Unlocking...' : 'Enter WatchNest'}
            </button>
          </form>

          <p className="text-center text-sm text-white/75 mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#00F0FF] font-semibold hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
