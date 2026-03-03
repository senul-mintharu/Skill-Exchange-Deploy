import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaUserCircle, FaMapMarkerAlt, FaTools, FaMoneyBillWave, FaSave, FaSpinner, FaIdCard, FaCalendarCheck } from 'react-icons/fa';
import { getProfileById, createProfile, updateProfile } from '../../services/profileService';
import './WorkerProfile.css'; // Import Vanilla CSS

const EditWorkerProfilePage = () => {
  const { id } = useParams(); // For edit mode
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    bio: '',
    skills: '', // stored as string for input, split for API
    district: '',
    serviceAreas: '', // stored as string for input, split for API
    hourlyRate: '',
    availability: ''
  });

  useEffect(() => {
    if (id) {
      fetchProfile();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfileById(id);
      setFormData({
        bio: data.bio || '',
        skills: data.skills ? data.skills.join(', ') : '',
        district: data.district || '',
        serviceAreas: data.serviceAreas ? data.serviceAreas.join(', ') : '',
        hourlyRate: data.hourlyRate || '',
        availability: data.availability || ''
      });
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
      bio: formData.bio,
      skills: formData.skills.split(',').map(s => s.trim()).filter(s => s),
      district: formData.district,
      serviceAreas: formData.serviceAreas.split(',').map(s => s.trim()).filter(s => s),
      hourlyRate: parseFloat(formData.hourlyRate),
      availability: formData.availability
    };

    try {
      if (id) {
        await updateProfile(id, payload);
        navigate(`/profile/${id}`); // Redirect to profile view
      } else {
        const data = await createProfile(payload);
        navigate(`/profile/${data.id}`); // Redirect to newly created profile
      }
    } catch (err) {
      if (err.response?.data?.details) {
        const errorMessages = Object.values(err.response.data.details).join(', ');
        setError(`Validation Error: ${errorMessages}`);
      } else {
        setError(err.response?.data?.message || 'Failed to save profile. Ensure User ID exists (try 1, 2...).');
      }
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

            <form onSubmit={handleSubmit}>

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

              {/* Availability Section */}
              <div className="wp-form-group">
                <label className="wp-label">
                  <FaCalendarCheck className="wp-label-icon" /> Availability
                </label>
                <select
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="wp-input"
                  required
                >
                  <option value="" disabled>Select availability</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Weekends Only">Weekends Only</option>
                  <option value="Evenings">Evenings</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
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

export default EditWorkerProfilePage;

