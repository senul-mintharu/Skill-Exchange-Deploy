import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getDefaultRouteForRole, register } from '../../services/authService';
import AuthShell from '../../components/ui/AuthShell';
import ErrorBanner from '../../components/common/ErrorBanner';

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.fullName || !formData.email || !formData.password) {
      setError('Full name, email and password are required');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || null,
        district: formData.district || null,
        role: formData.role,
        password: formData.password,
      };
      const response = await register(payload);
      const redirectTo = location.state?.from?.pathname;
      navigate(redirectTo || getDefaultRouteForRole(response.role), { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.message || 'Registration failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create Account"
      subtitle="Join LankaFix as a service seeker or skilled worker and start using the marketplace today."
      className="max-w-2xl"
      footer={(
        <p className="text-sm text-ink-muted">
          Already have an account?{' '}
          <Link to="/login" state={location.state} className="font-semibold text-brand-800 hover:text-brand-900">
            Login
          </Link>
        </p>
      )}
    >
      <div className="space-y-5">
        <ErrorBanner message={error} />

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="ui-field md:col-span-2">
              <label htmlFor="fullName" className="ui-label">Full Name</label>
              <input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} className="ui-input" required />
            </div>

            <div className="ui-field">
              <label htmlFor="email" className="ui-label">Email</label>
              <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="ui-input" required />
            </div>

            <div className="ui-field">
              <label htmlFor="phone" className="ui-label">Phone Number</label>
              <input id="phone" name="phone" value={formData.phone} onChange={handleChange} className="ui-input" />
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
              <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="ui-input" required />
            </div>

            <div className="ui-field">
              <label htmlFor="confirmPassword" className="ui-label">Confirm Password</label>
              <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="ui-input" required />
            </div>
          </div>

          <button type="submit" className="ui-button-primary flex w-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
      </div>
    </AuthShell>
  );
};

export default RegisterPage;
