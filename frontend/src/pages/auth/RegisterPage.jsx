import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, getDefaultRouteForRole, isAuthenticated, register } from '../../services/authService';
import AuthShell from '../../components/ui/AuthShell';
import ErrorBanner from '../../components/common/ErrorBanner';
import {
  getApiErrorMessage,
  validateEmailFormat,
  validatePasswordLength,
} from '../../utils/formValidationMessages';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    district: '',
    role: 'SEEKER',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
    if (name) {
      setFieldErrors((prev) => {
        if (!prev[name]) return prev;
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const next = {};
    if (!formData.fullName?.trim()) {
      next.fullName = 'Enter your full name.';
    }
    const emailErr = validateEmailFormat(formData.email);
    if (emailErr) next.email = emailErr;
    const passErr = validatePasswordLength(formData.password, 6);
    if (passErr) next.password = passErr;
    if (formData.password && formData.password !== formData.confirmPassword) {
      next.confirmPassword = 'Passwords must match. Type the same password in both fields.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone || null,
        district: formData.district || null,
        role: formData.role,
        password: formData.password,
      };
      const response = await register(payload);
      const redirectTo = location.state?.from?.pathname;
      navigate(redirectTo || getDefaultRouteForRole(response.role), { replace: true });
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Could not create your account. Please try again.');
      const lower = msg.toLowerCase();
      if (lower.includes('already') && lower.includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated()) {
    return <Navigate to={getDefaultRouteForRole(getCurrentUser()?.role)} replace />;
  }

  return (
    <AuthShell
      title="Sign up"
      subtitle="Create your account and start posting requests or finding work."
      className="max-w-2xl"
      footer={(
        <p className="text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-slate-900 hover:text-slate-700">
            Sign in
          </Link>
        </p>
      )}
    >
      <div className="space-y-5">
        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div className="grid gap-5 md:grid-cols-2">
            <div className="ui-field md:col-span-2">
              <label htmlFor="fullName" className="ui-label">Full Name</label>
              <input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="ui-input"
                autoComplete="name"
                aria-invalid={fieldErrors.fullName ? 'true' : 'false'}
              />
              {fieldErrors.fullName ? <p className="ui-error-text">{fieldErrors.fullName}</p> : null}
            </div>

            <div className="ui-field">
              <label htmlFor="email" className="ui-label">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="ui-input"
                autoComplete="email"
                aria-invalid={fieldErrors.email ? 'true' : 'false'}
              />
              {fieldErrors.email ? <p className="ui-error-text">{fieldErrors.email}</p> : null}
            </div>

            <div className="ui-field">
              <label htmlFor="phone" className="ui-label">Phone Number</label>
              <input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="ui-input" autoComplete="tel" />
            </div>

            <div className="ui-field">
              <label htmlFor="district" className="ui-label">District</label>
              <input id="district" name="district" value={formData.district} onChange={handleChange} className="ui-input" />
            </div>

            <div className="ui-field">
              <label htmlFor="role" className="ui-label">I want to...</label>
              <select id="role" name="role" value={formData.role} onChange={handleChange} className="ui-select">
                <option value="SEEKER">Find workers (Seeker)</option>
                <option value="WORKER">Find work (Worker)</option>
              </select>
            </div>

            <div className="ui-field">
              <label htmlFor="password" className="ui-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="ui-input"
                autoComplete="new-password"
                aria-invalid={fieldErrors.password ? 'true' : 'false'}
              />
              <p className="ui-helper">At least 6 characters.</p>
              {fieldErrors.password ? <p className="ui-error-text">{fieldErrors.password}</p> : null}
            </div>

            <div className="ui-field">
              <label htmlFor="confirmPassword" className="ui-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="ui-input"
                autoComplete="new-password"
                aria-invalid={fieldErrors.confirmPassword ? 'true' : 'false'}
              />
              {fieldErrors.confirmPassword ? <p className="ui-error-text">{fieldErrors.confirmPassword}</p> : null}
            </div>
          </div>

          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-2xl border border-brand-700 bg-brand-gradient px-4 py-3 text-sm font-semibold text-white shadow-brand transition hover:-translate-y-0.5 hover:shadow-panel disabled:cursor-not-allowed disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
