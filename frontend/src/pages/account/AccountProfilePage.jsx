import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, updateCurrentUser } from '../../services/authService';
import { deleteMyAccount, getMyAccount, updateMyAccount } from '../../services/userService';
import AuthShell from '../../components/ui/AuthShell';
import ErrorBanner from '../../components/common/ErrorBanner';

const AccountProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [editing, setEditing] = useState(location.pathname.endsWith('/edit'));
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: '',
    district: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true });
      setLoading(false);
      return;
    }

    const loadAccount = async () => {
      try {
        const account = await getMyAccount();
        setFormData({
          fullName: account.fullName || '',
          email: account.email || '',
          phoneNumber: account.phoneNumber || '',
          district: account.district || '',
        });
      } catch (err) {
        setMessage(err?.response?.data?.message || 'Failed to load account details');
      } finally {
        setLoading(false);
      }
    };

    loadAccount();
  }, [navigate, user]);

  if (!user) {
    return null;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSave = async (event) => {
    event.preventDefault();
    if (!formData.fullName.trim()) {
      setMessage('Name is required');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateMyAccount({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim() || null,
        district: formData.district.trim() || null,
      });
      updateCurrentUser({ fullName: updated.fullName, email: updated.email });
      setEditing(false);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm('This will permanently delete your account. Continue?');
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteMyAccount();
      logout();
      navigate('/register', { replace: true });
    } catch (err) {
      setMessage(err?.response?.data?.message || 'Failed to delete account');
    } finally {
      setDeleting(false);
    }
  };

  const formFields = (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="ui-field md:col-span-2">
        <label htmlFor="fullName" className="ui-label">Full Name</label>
        <input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} className="ui-input" disabled={!editing} />
      </div>

      <div className="ui-field">
        <label htmlFor="email" className="ui-label">Email</label>
        <input id="email" name="email" value={formData.email} onChange={handleChange} type="email" className="ui-input" disabled={!editing} />
      </div>

      <div className="ui-field">
        <label htmlFor="phoneNumber" className="ui-label">Phone Number</label>
        <input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="ui-input" disabled={!editing} />
      </div>

      <div className="ui-field">
        <label htmlFor="district" className="ui-label">District</label>
        <input id="district" name="district" value={formData.district} onChange={handleChange} className="ui-input" disabled={!editing} />
      </div>

      <div className="ui-field">
        <label className="ui-label">Role</label>
        <input value={user.role} className="ui-input" disabled />
      </div>
    </div>
  );

  if (loading) {
    return (
      <AuthShell title="My Profile" subtitle="Loading account details...">
        <div className="ui-loading-state">
          <div className="ui-spinner" />
          <p className="text-sm font-medium text-ink-muted">Fetching your profile…</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="My Profile"
      subtitle="View and manage your account details."
    >
      <div className="space-y-5">
        <ErrorBanner
          message={message}
          type={message.toLowerCase().includes('success') ? 'success' : 'error'}
          onClose={() => setMessage('')}
        />

        {editing ? (
          <form onSubmit={handleSave} className="space-y-5">
            {formFields}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="submit" className="ui-button-primary flex-1" disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button type="button" className="ui-button-ghost flex-1" onClick={() => setEditing(false)}>
                Cancel
              </button>
              <button type="button" className="ui-button-secondary flex-1" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {formFields}
            <div className="grid gap-3 sm:grid-cols-3">
              <button type="button" className="ui-button-primary" onClick={() => setEditing(true)}>
                Edit Profile
              </button>
              <button type="button" className="ui-button-secondary" onClick={handleLogout}>
                Logout
              </button>
              <button type="button" className="ui-button-danger" onClick={handleDeleteAccount} disabled={deleting}>
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        )}
      </div>
    </AuthShell>
  );
};

export default AccountProfilePage;
