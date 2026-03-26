import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, updateCurrentUser } from '../../services/authService';
import { deleteMyAccount, getMyAccount, updateMyAccount } from '../../services/userService';
import '../../pages/auth/LoginPage.css';

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
    district: ''
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
          district: account.district || ''
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSave = async (e) => {
    e.preventDefault();
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
        district: formData.district.trim() || null
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

  if (loading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-header">
            <h1>My Profile</h1>
            <p>Loading account details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>My Profile</h1>
          <p>View and manage your account details</p>
        </div>

        {message && <div className="alert">{message}</div>}

        {!editing ? (
          <div className="login-form">
            <div className="form-group">
              <label>Full Name</label>
              <input value={formData.fullName} disabled />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={formData.email} disabled />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input value={formData.phoneNumber || '-'} disabled />
            </div>
            <div className="form-group">
              <label>District</label>
              <input value={formData.district || '-'} disabled />
            </div>
            <div className="form-group">
              <label>Role</label>
              <input value={user.role} disabled />
            </div>
            <button type="button" className="btn btn-primary btn-full" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
            <button type="button" className="btn btn-full" onClick={handleLogout}>
              Logout
            </button>
            <button type="button" className="btn btn-full" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Deleting account...' : 'Delete Account'}
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input id="email" name="email" value={formData.email} onChange={handleChange} type="email" />
            </div>
            <div className="form-group">
              <label htmlFor="phoneNumber">Phone Number</label>
              <input id="phoneNumber" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="district">District</label>
              <input id="district" name="district" value={formData.district} onChange={handleChange} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button type="button" className="btn btn-full" onClick={() => setEditing(false)}>Cancel</button>
            <button type="button" className="btn btn-full" onClick={handleLogout}>Logout</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountProfilePage;
