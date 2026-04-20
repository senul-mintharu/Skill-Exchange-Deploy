import React, { useState } from 'react';
import { useNavigate, Link, useLocation, Navigate } from 'react-router-dom';
import { getCurrentUser, getDefaultRouteForRole, isAuthenticated, login } from '../../services/authService';
import AuthShell from '../../components/ui/AuthShell';
import ErrorBanner from '../../components/common/ErrorBanner';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await login(formData.email, formData.password);
      const redirectTo = location.state?.from?.pathname;
      navigate(redirectTo || getDefaultRouteForRole(response.role), { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Invalid email or password. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated()) {
    return <Navigate to={getDefaultRouteForRole(getCurrentUser()?.role)} replace />;
  }

  return (
    <AuthShell
      title="Sign in"
      subtitle="Welcome back. Continue to your requests, quotes, and dashboard."
      footer={(
        <p className="text-sm text-ink-muted">
          New to Skill Exchange?{' '}
          <Link to="/register" state={location.state} className="font-semibold text-slate-900 hover:text-slate-700">
            Create an account
          </Link>
        </p>
      )}
    >
      <div className="space-y-5">
        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="ui-field">
            <label htmlFor="email" className="ui-label">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              className="ui-input"
              required
            />
          </div>

          <div className="ui-field">
            <label htmlFor="password" className="ui-label">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              className="ui-input"
              required
            />
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl border border-brand-700 bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5 hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default LoginPage;
