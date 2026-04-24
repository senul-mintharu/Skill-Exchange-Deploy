import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { createProfile, getProfileById, updateProfile, uploadProfilePaymentSlip } from '../../services/profileService';
import { CATEGORIES, DISTRICTS, SERVING_AREAS } from '../../utils/constants';
import { AlertPanel, LoadingPanel, PageIntro } from '../../components/ui/PortalPrimitives';
import { useToast } from '../../components/common/ToastContext';

const PAYMENT_DETAILS = {
  amount: 500,
  bank: 'Bank of Ceylon',
  accountNumber: '76221736',
  branch: 'Colombo Fort',
  accountName: 'WedaLK Platform (Pvt) Ltd',
};

const EditWorkerProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [error, setError] = useState('');
  const [paymentSlip, setPaymentSlip] = useState(null);
  const [paymentSlipPreview, setPaymentSlipPreview] = useState('');
  const [slipError, setSlipError] = useState('');
  const slipInputRef = useRef(null);
  const [skillInput, setSkillInput] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    contactNumber: '',
    bio: '',
    primaryCategories: [],
    specificSkills: [],
    district: '',
    serviceAreas: [],
    hourlyRate: '',
    availability: '',
    profilePictureUrl: '',
  });

  const fetchProfile = useCallback(async () => {
    if (!id) return;
    try {
      setFetchingProfile(true);
      const data = await getProfileById(id);
      setFormData({
        fullName: data.fullName || '',
        contactNumber: data.contactNumber || '',
        bio: data.bio || '',
        primaryCategories: data.skills || [],
        specificSkills: [],
        district: data.district || '',
        serviceAreas: data.serviceAreas || [],
        hourlyRate: data.hourlyRate || '',
        availability: data.availability || '',
        profilePictureUrl: data.profilePictureUrl || '',
      });
    } catch (err) {
      setError('Failed to fetch profile');
    } finally {
      setFetchingProfile(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleCategoryToggle = (categoryLabel) => {
    setFormData((prev) => ({
      ...prev,
      primaryCategories: prev.primaryCategories.includes(categoryLabel)
        ? prev.primaryCategories.filter((item) => item !== categoryLabel)
        : [...prev.primaryCategories, categoryLabel],
    }));
  };

  const handleAddSkill = () => {
    const skill = skillInput.trim();
    if (skill && !formData.specificSkills.includes(skill)) {
      setFormData((prev) => ({ ...prev, specificSkills: [...prev.specificSkills, skill] }));
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    setFormData((prev) => ({
      ...prev,
      specificSkills: prev.specificSkills.filter((item) => item !== skill),
    }));
  };

  const handleDistrictChange = (event) => {
    const district = event.target.value;
    setFormData((prev) => ({
      ...prev,
      district,
      serviceAreas: [],
    }));
  };

  const handleServiceAreaToggle = (area) => {
    setFormData((prev) => ({
      ...prev,
      serviceAreas: prev.serviceAreas.includes(area)
        ? prev.serviceAreas.filter((item) => item !== area)
        : [...prev.serviceAreas, area],
    }));
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, profilePictureUrl: reader.result }));
      }
    };
    reader.onerror = () => {
      setError('Failed to process the selected photo. Please try a different image.');
    };
    reader.readAsDataURL(file);
  };

  const handleSlipChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPaymentSlip(file);
    setSlipError('');
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPaymentSlipPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPaymentSlipPreview('pdf');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSlipError('');

    if (formData.primaryCategories.length === 0) {
      setError('Please select at least one primary service category');
      setLoading(false);
      return;
    }

    if (formData.serviceAreas.length === 0) {
      setError('Please select at least one service area');
      setLoading(false);
      return;
    }

    // Require payment slip for new profile creation
    if (!id && !paymentSlip) {
      setSlipError('Please upload your bank transfer slip to complete profile registration.');
      setLoading(false);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      return;
    }

    const payload = {
      fullName: formData.fullName,
      contactNumber: formData.contactNumber,
      bio: formData.bio,
      profilePictureUrl: formData.profilePictureUrl || null,
      skills: [...formData.primaryCategories, ...formData.specificSkills],
      district: formData.district,
      serviceAreas: formData.serviceAreas,
      hourlyRate: parseFloat(formData.hourlyRate),
      availability: formData.availability,
    };

    try {
      if (id) {
        await updateProfile(id, payload);
        toast.success('Your profile has been updated successfully!', { title: 'Profile Saved' });
        navigate(`/profile/${id}`);
      } else {
        const data = await createProfile(payload);
        await uploadProfilePaymentSlip(data.id, paymentSlip);
        toast.success('Your worker profile has been created! Welcome aboard.', { title: 'Registration Complete' });
        navigate(`/profile/${data.id}`, { state: { profileCreated: true } });
      }
    } catch (err) {
      if (err.response?.data?.details) {
        setError(`Validation Error: ${Object.values(err.response.data.details).join(', ')}`);
      } else {
        setError(err.response?.data?.message || 'Failed to save profile. Please check all fields.');
      }
      toast.error(
        err.response?.data?.message || 'Failed to save your profile. Please review the form and try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  if (fetchingProfile) {
    return (
      <div className="page-wrapper">
        <main className="ui-shell">
          <LoadingPanel message="Loading profile..." />
        </main>
      </div>
    );
  }

  const availableServiceAreas = formData.district && SERVING_AREAS[formData.district]
    ? SERVING_AREAS[formData.district]
    : [];

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Worker Profile"
          title={id ? 'Edit Your Profile' : 'Create Your Profile'}
          subtitle="Shape the profile seekers will see when deciding who to hire."
          light
        />

        {error ? (
          <AlertPanel tone="danger" icon="error" title="Please review the form">
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-5">
          <section className="ui-panel p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative h-28 w-28">
                <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border-4 border-white bg-brand-gradient text-4xl font-bold text-white shadow-brand">
                  {formData.profilePictureUrl ? (
                    <img src={formData.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <span className="material-icons text-5xl">person</span>
                  )}
                </div>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 z-20 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white text-brand-800 shadow-soft ring-2 ring-white">
                  <span className="material-icons text-lg">add_a_photo</span>
                </label>
                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-ink">Professional Photo</h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-ink-muted">
                  Upload a clear photo of yourself so seekers can recognize you on your public profile.
                </p>
              </div>
            </div>
          </section>

          <section className="ui-card p-6">
            <h2 className="text-2xl font-bold text-ink">Personal Information</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="ui-field">
                <label className="ui-label">Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className="ui-input" placeholder="e.g. Ruwan Perera" required />
              </div>
              <div className="ui-field">
                <label className="ui-label">Contact Number</label>
                <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleChange} className="ui-input" placeholder="+94 77 123 4567" required />
              </div>
              <div className="ui-field md:col-span-2">
                <label className="ui-label">Professional Bio</label>
                <textarea name="bio" value={formData.bio} onChange={handleChange} className="ui-textarea" placeholder="Briefly describe your experience and the quality of work you provide..." required />
              </div>
            </div>
          </section>

          <section className="ui-card p-6">
            <h2 className="text-2xl font-bold text-ink">Work Expertise</h2>
            <div className="mt-5 space-y-5">
              <div>
                <p className="ui-label">Primary Service Categories</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {CATEGORIES.map((category) => {
                    const selected = formData.primaryCategories.includes(category.label);
                    return (
                      <button
                        key={category.value}
                        type="button"
                        onClick={() => handleCategoryToggle(category.label)}
                        className={selected ? 'ui-button-primary justify-start' : 'ui-button-ghost justify-start'}
                      >
                        <span>{category.icon}</span>
                        {category.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="ui-field">
                <label className="ui-label">Specific Skills</label>
                {formData.specificSkills.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.specificSkills.map((skill) => (
                      <span key={skill} className="inline-flex items-center gap-2 rounded-chip border border-brand-200 bg-chip-gradient px-4 py-2 text-sm font-semibold text-brand-800">
                        {skill}
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="inline-flex">
                          <span className="material-icons text-base">close</span>
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(event) => setSkillInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="ui-input flex-1"
                    placeholder="Add a skill (e.g. Tile Laying)"
                  />
                  <button type="button" onClick={handleAddSkill} className="ui-button-secondary">
                    Add Skill
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="ui-card p-6">
            <h2 className="text-2xl font-bold text-ink">Rate & Availability</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div className="ui-field">
                <label className="ui-label">Hourly Rate</label>
                <div className="ui-input-icon-wrap">
                  <span className="text-sm font-semibold text-ink-subtle">Rs.</span>
                  <input type="number" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} min="0" step="0.01" placeholder="1500" required />
                </div>
              </div>
              <div className="ui-field">
                <label className="ui-label">Availability</label>
                <select name="availability" value={formData.availability} onChange={handleChange} className="ui-select" required>
                  <option value="">Select availability</option>
                  <option value="Full Time">Full Time</option>
                  <option value="Part Time">Part Time</option>
                  <option value="Weekends Only">Weekends Only</option>
                  <option value="Evenings">Evenings</option>
                  <option value="Negotiable">Negotiable</option>
                </select>
              </div>
            </div>
          </section>

          <section className="ui-card p-6">
            <h2 className="text-2xl font-bold text-ink">Service Coverage</h2>
            <div className="mt-5 space-y-5">
              <div className="ui-field">
                <label className="ui-label">Base District</label>
                <select name="district" value={formData.district} onChange={handleDistrictChange} className="ui-select" required>
                  <option value="">Select your base district</option>
                  {DISTRICTS.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>

              {formData.district && availableServiceAreas.length > 0 ? (
                <div>
                  <p className="ui-label">Serving Areas</p>
                  <p className="ui-helper mt-1">Select the specific areas you are willing to travel to.</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {availableServiceAreas.map((area) => {
                      const selected = formData.serviceAreas.includes(area);
                      return (
                        <button
                          key={area}
                          type="button"
                          onClick={() => handleServiceAreaToggle(area)}
                          className={selected ? 'ui-button-primary justify-start' : 'ui-button-ghost justify-start'}
                        >
                          {area}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-card border border-dashed border-brand-200 bg-brand-50/70 px-5 py-6 text-center">
                    <span className="material-icons text-4xl text-brand-700">map</span>
                    <p className="mt-3 text-sm font-semibold text-brand-800">Sri Lanka service map preview</p>
                    <p className="mt-2 text-sm text-ink-muted">
                      Your selected areas help seekers understand exactly where you work.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {!id ? (
            <section className="ui-card p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white">
                  <span className="material-icons text-xl">account_balance</span>
                </span>
                <div>
                  <h2 className="text-2xl font-bold text-ink">Registration Payment</h2>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">
                    Make a one-time bank transfer of <strong>Rs. {PAYMENT_DETAILS.amount.toLocaleString()}.00</strong> to complete your worker registration. Upload the transfer slip below.
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-card border border-amber-200 bg-amber-50 px-5 py-4">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-amber-800">Bank Transfer Details</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Amount', value: `Rs. ${PAYMENT_DETAILS.amount.toLocaleString()}.00`, highlight: true },
                    { label: 'Account Name', value: PAYMENT_DETAILS.accountName },
                    { label: 'Account Number', value: PAYMENT_DETAILS.accountNumber },
                    { label: 'Bank', value: PAYMENT_DETAILS.bank },
                    { label: 'Branch', value: PAYMENT_DETAILS.branch },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-card border px-4 py-3 bg-white ${item.highlight ? 'border-amber-300' : 'border-amber-100'}`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.14em] text-amber-700">{item.label}</p>
                      <p className={`mt-1 font-bold text-ink ${item.highlight ? 'text-xl text-amber-900' : 'text-base'}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 ui-field">
                <p className="ui-label">Upload Transfer Slip</p>
                <p className="mt-1 text-sm text-ink-muted">Accepted: JPG, PNG, or PDF — max 5 MB</p>

                <div
                  className={`mt-3 flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-8 transition cursor-pointer ${paymentSlip ? 'border-green-300 bg-green-50' : 'border-brand-200 bg-brand-50/50 hover:bg-brand-50'}`}
                  onClick={() => slipInputRef.current?.click()}
                  onKeyDown={(e) => e.key === 'Enter' && slipInputRef.current?.click()}
                  role="button"
                  tabIndex={0}
                >
                  {paymentSlip ? (
                    <div className="flex flex-col items-center gap-3 text-center">
                      {paymentSlipPreview && paymentSlipPreview !== 'pdf' ? (
                        <img src={paymentSlipPreview} alt="Slip preview" className="max-h-40 rounded-card object-contain shadow-soft" />
                      ) : (
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                          <span className="material-icons text-3xl text-green-700">picture_as_pdf</span>
                        </span>
                      )}
                      <div>
                        <p className="text-sm font-bold text-green-800">{paymentSlip.name}</p>
                        <p className="mt-1 text-xs text-green-700">{(paymentSlip.size / 1024).toFixed(1)} KB — Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100">
                        <span className="material-icons text-3xl text-brand-700">upload_file</span>
                      </span>
                      <div>
                        <p className="text-sm font-bold text-brand-800">Click to upload your slip</p>
                        <p className="mt-1 text-xs text-ink-muted">JPG, PNG or PDF up to 5 MB</p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={slipInputRef}
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={handleSlipChange}
                  className="hidden"
                />
                {slipError ? <p className="mt-2 ui-error-text">{slipError}</p> : null}
              </div>

              <div className="mt-4 rounded-card border border-line bg-surface-muted/60 px-4 py-3">
                <div className="flex items-start gap-3">
                  <span className="material-icons mt-0.5 text-brand-700">info</span>
                  <p className="text-sm leading-6 text-ink-muted">
                    Your profile will go live immediately after slip upload. Our team may verify the payment if needed.
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="ui-button-ghost" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button type="submit" className="ui-button-primary" disabled={loading}>
              {loading ? 'Saving...' : id ? 'Update Profile' : 'Pay & Complete Registration'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default EditWorkerProfilePage;
