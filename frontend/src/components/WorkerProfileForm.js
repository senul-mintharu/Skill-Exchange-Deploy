import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUserCircle, FaMapMarkerAlt, FaTools, FaMoneyBillWave, FaSave, FaSpinner, FaIdCard } from 'react-icons/fa';
import '../styles/WorkerProfile.css'; // Import Vanilla CSS

const WorkerProfileForm = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // State for User ID (manual entry)
  const [userId, setUserId] = useState('');

  const [formData, setFormData] = useState({
    bio: '',
    skills: '', // stored as string for input, split for API
    district: '',
    serviceAreas: '', // stored as string for input, split for API
    hourlyRate: ''
  });

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:8081/api/profiles/${id}`);
      const data = response.data;
      setFormData({
        bio: data.bio,
        skills: data.skills.join(', '),
        district: data.district,
        serviceAreas: data.serviceAreas.join(', '),
        hourlyRate: data.hourlyRate
      });
      setUserId(data.userId); // Ensure we keep the correct user ID
    } catch (err) {
      setError('Failed to fetch profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const payload = {
      userId: userId, // Include userId for creation
      bio: formData.bio,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      district: formData.district,
      serviceAreas: formData.serviceAreas.split(',').map(s => s.trim()).filter(s => s),
      hourlyRate: parseFloat(formData.hourlyRate)
    };

    try {
      if (id) {
        await axios.put(`http://localhost:8081/api/profiles/${id}`, payload);
      } else {
        await axios.post('http://localhost:8081/api/profiles', payload);
      }
      navigate(id ? `/profile/${id}` : '/'); // Redirect to profile view or home
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save profile. Ensure User ID exists (try 1, 2...).');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="wp-container">
      <div className="wp-wrapper">
        <div className="wp-card">
          {/* Header */}
          <div className="wp-header">
            <h2>
              {id ? 'Edit Your Profile' : 'Create Your Worker Profile'}
            </h2>
            <p>
              {id ? 'Update your professional details to attract more clients.' : 'Showcase your skills and start earning on WedaLK.'}
            </p>
          </div>

          <div className="wp-form-content">
            {error && (
              <div className="wp-error">
                <p>{error}</p>
              </div>
            )}

            {!id && (
              <div className="wp-note">
                <p>Enter the <strong>User ID</strong> you want to create a profile for (e.g., 1, 2, 3).</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>

              {/* User ID Section (Only show if creating new profile or if needed) */}
              {!id && (
                <div className="wp-form-group">
                  <label className="wp-label">
                    <FaIdCard className="wp-label-icon" /> User ID
                  </label>
                  <input
                    type="number"
                    name="userId"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    className="wp-input"
                    placeholder="Enter User ID (e.g. 1)"
                    required
                    min="1"
                  />
                </div>
              )}

              {/* Bio Section */}
              <div className="wp-form-group">
                <label className="wp-label">
                  <FaUserCircle className="wp-label-icon" /> Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  className="wp-textarea"
                  placeholder="Tell clients about your experience and why they should hire you..."
                  required
                />
              </div>

              {/* Skills Section */}
              <div className="wp-form-group">
                <label className="wp-label">
                  <FaTools className="wp-label-icon" /> Skills
                </label>
                <input
                  type="text"
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  className="wp-input"
                  placeholder="e.g. Plumbing, Electrical, Carpentry (comma separated)"
                  required
                />
                <p className="wp-helper-text">Separate multiple skills with commas.</p>
              </div>

              <div className="wp-grid-2">
                {/* District Section */}
                <div className="wp-form-group">
                  <label className="wp-label">
                    <FaMapMarkerAlt className="wp-label-icon" /> District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="wp-input"
                    placeholder="e.g. Colombo"
                    required
                  />
                </div>

                {/* Hourly Rate Section */}
                <div className="wp-form-group">
                  <label className="wp-label">
                    <FaMoneyBillWave className="wp-label-icon" /> Hourly Rate (LKR)
                  </label>
                  <div className="wp-input-group">
                    <div className="wp-input-prefix">
                      <span>LKR</span>
                    </div>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleChange}
                      className="wp-input wp-input-with-prefix"
                      placeholder="e.g. 1500"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Service Areas Section */}
              <div className="wp-form-group">
                <label className="wp-label">
                  <FaMapMarkerAlt className="wp-label-icon" /> Service Areas
                </label>
                <input
                  type="text"
                  name="serviceAreas"
                  value={formData.serviceAreas}
                  onChange={handleChange}
                  className="wp-input"
                  placeholder="e.g. Colombo 01, Colombo 03, Dehiwala (comma separated)"
                  required
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="wp-btn-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="wp-spinner" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave style={{ marginRight: '0.5rem' }} />
                    {id ? 'Update Profile' : 'Create Profile'}
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerProfileForm;
