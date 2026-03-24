import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, logout, updateCurrentUser } from '../../services/authService';
import '../../pages/auth/LoginPage.css';

const AccountProfilePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [editing, setEditing] = useState(location.pathname.endsWith('/edit'));
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    email: user?.email || ''
  });

  if (!user) {
    navigate('/login', { replace: true });
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setMessage('');
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setMessage('Name is required');
      return;
    }
    updateCurrentUser({ fullName: formData.fullName.trim() });
    setEditing(false);
    setMessage('Profile updated successfully');
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

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
              <label>Role</label>
              <input value={user.role} disabled />
            </div>
            <button type="button" className="btn btn-primary btn-full" onClick={() => setEditing(true)}>
              Edit Profile
            </button>
            <button type="button" className="btn btn-full" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <form className="login-form" onSubmit={handleSave}>
            <div className="form-group">
              <label htmlFor="fullName">Full Name</label>
              <input id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input value={formData.email} disabled />
            </div>
            <button type="submit" className="btn btn-primary btn-full">Save Changes</button>
            <button type="button" className="btn btn-full" onClick={() => setEditing(false)}>Cancel</button>
            <button type="button" className="btn btn-full" onClick={handleLogout}>Logout</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AccountProfilePage;
