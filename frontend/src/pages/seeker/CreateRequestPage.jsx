import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createRequest, generateRequestDescription, updateRequest } from '../../services/requestService';
import { CATEGORIES, formatBudget } from '../../utils/constants';
import { AlertPanel, PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';
import ErrorBanner from '../../components/common/ErrorBanner';

const urgencyOptions = [
  { value: 'LOW', label: 'Low', subtitle: 'Within a week', icon: '📅', tone: 'info', hint: 'Flexible timing' },
  { value: 'MEDIUM', label: 'Medium', subtitle: 'Within 48 hours', icon: '⏰', tone: 'info', hint: 'Soon, but not urgent' },
  { value: 'HIGH', label: 'High', subtitle: 'ASAP / Today', icon: '⚡', tone: 'warning', hint: 'Quick response preferred' },
  { value: 'URGENT', label: 'Urgent', subtitle: 'Emergency', icon: '🚨', tone: 'danger', hint: 'Immediate attention needed' },
];

const categoryHints = {
  PLUMBING: 'Leaks, pipes, fittings, bathrooms',
  ELECTRICAL: 'Switches, wiring, lights, breakers',
  CARPENTRY: 'Woodwork, repairs, fittings, shelves',
  PAINTING: 'Walls, touch-ups, coating, finishing',
  CLEANING: 'Deep cleaning, move-out, routine support',
  AC_REPAIR: 'Cooling issues, servicing, maintenance',
  APPLIANCE_REPAIR: 'Kitchen and home appliance fixes',
  GARDENING: 'Yard care, trimming, upkeep, cleanup',
  MASONRY: 'Brickwork, cement, patching, surfaces',
  ROOFING: 'Leaks, repairs, tiles, structural checks',
  PEST_CONTROL: 'Insects, rodents, treatment, prevention',
  OTHER: 'Custom work not covered above',
};

const stepDetails = [
  { step: 1, title: 'Title & Category', description: 'Define the job and where it is located.' },
  { step: 2, title: 'Details & Timing', description: 'Explain the problem, urgency, and budget.' },
  { step: 3, title: 'Review & Submit', description: 'Double-check the final details before posting.' },
];

const DESCRIPTION_LIMIT = 2000;
const AI_CONTEXT_MESSAGE = 'Please enter a Job Title and Category first so the AI understands your needs.';
const AI_FAILURE_MESSAGE = 'AI generation is currently unavailable. Please write your description manually or try again later.';

const previewText = (text) => {
  if (!text) return 'A clear description helps workers understand the issue and quote accurately.';
  return text;
};

const CreateRequestPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(location.state?.requestToEdit);
  const requestToEdit = isEditMode ? location.state.requestToEdit : null;
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiBanner, setAiBanner] = useState({ message: '', type: 'error' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    title: requestToEdit?.title || '',
    category: requestToEdit?.category || '',
    locationArea: requestToEdit?.locationArea || '',
    description: requestToEdit?.description || '',
    urgency: requestToEdit?.urgency || 'MEDIUM',
    budget: requestToEdit?.budget || '',
  });

  useEffect(() => {
    if (isEditMode) {
      setCurrentStep(1);
    }
  }, [isEditMode]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const nextErrors = {};
    if (step === 1) {
      if (!formData.title.trim()) nextErrors.title = 'Title is required';
      else if (formData.title.trim().length > 150) nextErrors.title = 'Title must not exceed 150 characters';
      if (!formData.category) nextErrors.category = 'Please select a category';
      if (!formData.locationArea.trim()) nextErrors.locationArea = 'Location is required';
    }
    if (step === 2) {
      if (!formData.description.trim()) nextErrors.description = 'Description is required';
      else if (formData.description.trim().length < 20) nextErrors.description = 'Description must be at least 20 characters';
      else if (formData.description.length > DESCRIPTION_LIMIT) nextErrors.description = 'Description must not exceed 2000 characters';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAiAssist = async () => {
    if (!formData.title.trim() || !formData.category) {
      setAiBanner({ message: AI_CONTEXT_MESSAGE, type: 'warning' });
      return;
    }

    setAiBanner({ message: '', type: 'error' });
    setAiLoading(true);

    try {
      const response = await generateRequestDescription({
        title: formData.title.trim(),
        category: formData.category,
        locationArea: formData.locationArea.trim(),
        urgency: formData.urgency,
        existingDescription: formData.description.trim(),
      });
      handleChange('description', (response?.draft || '').slice(0, DESCRIPTION_LIMIT));
    } catch (err) {
      setAiBanner({ message: AI_FAILURE_MESSAGE, type: 'error' });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.locationArea || !formData.category || !formData.urgency) {
      setError('Please fill in all required details before submitting.');
      return;
    }
    if (!formData.budget && formData.budget !== 0) {
      setError('Please provide a budget for your request.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const payload = {
        title: formData.title,
        category: formData.category,
        locationArea: formData.locationArea,
        description: formData.description,
        urgency: formData.urgency,
        budget: formData.budget,
      };

      if (isEditMode) {
        await updateRequest(requestToEdit.id, payload);
        setSuccess(true);
        setTimeout(() => navigate(`/my-requests/${requestToEdit.id}`), 1800);
      } else {
        await createRequest(payload);
        setSuccess(true);
        setTimeout(() => navigate('/my-requests'), 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} request. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const selectedCategory = useMemo(
    () => CATEGORIES.find((item) => item.value === formData.category),
    [formData.category],
  );
  const selectedUrgency = useMemo(
    () => urgencyOptions.find((item) => item.value === formData.urgency),
    [formData.urgency],
  );

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <PageIntro
          eyebrow="Request Wizard"
          title={isEditMode ? 'Edit Your Request' : 'Post a New Request'}
          subtitle={isEditMode
            ? 'Update the details below so workers can clearly understand the latest version of your job.'
            : 'Create a request that is easy to scan, easy to quote, and easy for the right worker to understand quickly.'}
          light
        />

        {error ? (
          <AlertPanel tone="danger" icon="error_outline" title="Please review your request">
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {success ? (
          <AlertPanel tone="success" icon="check_circle" title="Request saved">
            <p>Request {isEditMode ? 'updated' : 'created'} successfully. Redirecting...</p>
          </AlertPanel>
        ) : null}

        <div className="grid items-start gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
            <SectionCard className="border-brand-100 bg-white shadow-card">
              <p className="ui-stat-label">Progress</p>
              <h2 className="mt-2 text-xl font-bold text-ink">Build a request workers can quote fast.</h2>
              <p className="mt-2 text-sm leading-6 text-ink-muted">
                Each step adds information that helps workers understand the task and avoid vague estimates.
              </p>

              <div className="mt-4 space-y-3">
                {stepDetails.map((item) => {
                  const active = currentStep === item.step;
                  const complete = currentStep > item.step;
                  return (
                    <div
                      key={item.step}
                      className={`rounded-card border px-4 py-3.5 transition ${active
                        ? 'border-brand-200 bg-brand-50/80 shadow-soft'
                        : complete
                          ? 'border-green-100 bg-green-50/80'
                          : 'border-line bg-surface-muted/70'}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${active
                          ? 'bg-brand-gradient text-white'
                          : complete
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-brand-800'}`}>
                          {complete ? '✓' : item.step}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-ink">{item.title}</p>
                          <p className="mt-1 text-sm leading-6 text-ink-muted">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard className="border-brand-100 bg-white shadow-card">
              <p className="ui-stat-label">Live Preview</p>
              <h2 className="mt-2 text-xl font-bold text-ink">How your request reads</h2>

              <div className="mt-4 rounded-card border border-brand-100 bg-brand-50/75 p-4 shadow-soft">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="ui-badge">{selectedCategory?.label || 'Choose a category'}</span>
                  <StatusPill tone={selectedUrgency?.tone || 'info'}>
                    {selectedUrgency?.label || 'Medium'}
                  </StatusPill>
                </div>
                <h3 className="mt-3 text-xl font-bold leading-tight text-ink">
                  {formData.title || 'Add a clear request title'}
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="rounded-card border border-line bg-white px-4 py-3">
                    <p className="ui-stat-label">Location</p>
                    <p className="mt-2 text-base font-bold text-ink">{formData.locationArea || 'Not set yet'}</p>
                  </div>
                  <div className="rounded-card border border-line bg-white px-4 py-3">
                    <p className="ui-stat-label">Budget</p>
                    <p className="mt-2 text-base font-bold text-ink">
                      {formData.budget || formData.budget === 0 ? formatBudget(formData.budget) : 'Add your budget'}
                    </p>
                  </div>
                </div>
                <div className="mt-3 rounded-card border border-line bg-white px-4 py-3">
                  <p className="ui-stat-label">Description Preview</p>
                  <p className="mt-2 text-sm leading-6 text-ink-muted">{previewText(formData.description)}</p>
                </div>
              </div>
            </SectionCard>
          </aside>

          <section className="ui-panel p-4 sm:p-5 lg:p-6">
            {currentStep === 1 ? (
              <div className="space-y-5">
                <div className="border-b border-line pb-4">
                  <h2 className="text-xl font-bold text-ink sm:text-2xl">What do you need help with?</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                    Start with the job name, category, and exact area so workers instantly know what they are looking at.
                  </p>
                </div>

                <div className="ui-field">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="ui-label" htmlFor="title">Request Title</label>
                    <span className="text-xs font-semibold text-ink-subtle">{formData.title.length} / 150</span>
                  </div>
                  <div className="ui-input-icon-wrap">
                    <span className="material-icons text-brand-700">edit</span>
                    <input
                      id="title"
                      type="text"
                      value={formData.title}
                      onChange={(event) => handleChange('title', event.target.value)}
                      placeholder="E.g., Fix leaking kitchen tap"
                      maxLength={150}
                    />
                  </div>
                  {errors.title ? <p className="ui-error-text">{errors.title}</p> : null}
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="ui-label">Service Category</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Select one</p>
                  </div>
                  <div className="mt-3 grid auto-rows-fr grid-cols-2 gap-3 lg:grid-cols-4">
                    {CATEGORIES.map((category) => {
                      const active = formData.category === category.value;
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => handleChange('category', category.value)}
                          className={`h-full min-h-[124px] rounded-card border px-3 py-2.5 text-left transition ${active
                            ? 'border-brand-200 bg-brand-50 text-brand-900 shadow-soft'
                            : 'border-line bg-white text-ink hover:border-brand-100 hover:bg-brand-50/40'}`}
                        >
                          <div className="flex h-full items-start gap-2.5">
                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg ${active ? 'bg-brand-gradient text-white' : 'bg-brand-50 text-brand-800'}`}>
                              {category.icon}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-bold sm:text-base">{category.label}</span>
                              <span className="mt-0.5 block text-xs leading-5 text-ink-muted sm:text-sm">
                                {categoryHints[category.value] || 'General service work'}
                              </span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {errors.category ? <p className="mt-2 ui-error-text">{errors.category}</p> : null}
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="location">Where is the task located?</label>
                  <div className="ui-input-icon-wrap">
                    <span className="material-icons text-brand-700">location_on</span>
                    <input
                      id="location"
                      type="text"
                      value={formData.locationArea}
                      onChange={(event) => handleChange('locationArea', event.target.value)}
                      placeholder="Enter area or city (e.g., Colombo 03)"
                    />
                  </div>
                  {errors.locationArea ? <p className="ui-error-text">{errors.locationArea}</p> : null}
                </div>
              </div>
            ) : null}

            {currentStep === 2 ? (
              <div className="space-y-5">
                <div className="border-b border-line pb-4">
                  <h2 className="text-xl font-bold text-ink sm:text-2xl">Tell workers what matters</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                    Specific details help workers price the job correctly and reduce back-and-forth questions.
                  </p>
                </div>

                <div className="ui-field">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="ui-label" htmlFor="description">Task Description</label>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs font-semibold text-ink-subtle">{formData.description.length} / {DESCRIPTION_LIMIT}</span>
                      <button
                        type="button"
                        onClick={handleAiAssist}
                        disabled={aiLoading}
                        className="inline-flex min-h-[36px] items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-brand-900 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        <span className={`material-icons text-base ${aiLoading ? 'animate-spin' : ''}`}>
                          {aiLoading ? 'progress_activity' : 'auto_awesome'}
                        </span>
                        {aiLoading ? 'Drafting...' : 'AI Assist'}
                      </button>
                    </div>
                  </div>
                  <ErrorBanner
                    message={aiBanner.message}
                    type={aiBanner.type}
                    onClose={() => setAiBanner({ message: '', type: 'error' })}
                  />
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(event) => handleChange('description', event.target.value)}
                    placeholder="Example: I need a leaking tap fixed in the kitchen. It seems to be dripping from the handle..."
                    rows="6"
                    className="ui-textarea"
                    maxLength={DESCRIPTION_LIMIT}
                    disabled={aiLoading}
                  />
                  {errors.description ? <p className="ui-error-text">{errors.description}</p> : null}
                  <div className="grid gap-3 sm:grid-cols-3">
                    {[
                      'Explain the issue clearly',
                      'Mention size, area, or quantity',
                      'Add useful details about timing or access',
                    ].map((hint) => (
                      <div key={hint} className="rounded-card border border-line bg-surface-muted px-4 py-3 text-sm font-medium text-ink-muted">
                        {hint}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="ui-label">How urgent is this task?</p>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">Choose one</p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    {urgencyOptions.map((option) => {
                      const active = formData.urgency === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleChange('urgency', option.value)}
                          className={`min-h-[96px] rounded-card border px-4 py-3 text-left transition ${active
                            ? option.tone === 'danger'
                              ? 'border-red-200 bg-red-50 shadow-soft'
                              : option.tone === 'warning'
                                ? 'border-amber-200 bg-amber-50 shadow-soft'
                                : 'border-brand-200 bg-brand-50 shadow-soft'
                            : 'border-line bg-white hover:border-brand-100 hover:bg-brand-50/30'}`}
                        >
                          <div className="flex items-start gap-3">
                            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xl ${active
                              ? option.tone === 'danger'
                                ? 'bg-red-600 text-white'
                                : option.tone === 'warning'
                                  ? 'bg-amber-500 text-white'
                                  : 'bg-brand-gradient text-white'
                              : 'bg-brand-50 text-brand-800'}`}>
                              {option.icon}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-base font-bold text-ink">{option.label}</span>
                              <span className="mt-1 block text-sm leading-6 text-ink-muted">{option.subtitle}</span>
                              <span className="mt-2 block text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle">{option.hint}</span>
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="ui-field">
                  <label className="ui-label" htmlFor="budget">What is your budget for this task?</label>
                  <div className="ui-input-icon-wrap">
                    <span className="text-sm font-semibold text-ink-subtle">රු</span>
                    <input
                      id="budget"
                      type="number"
                      value={formData.budget}
                      onChange={(event) => handleChange('budget', event.target.value)}
                      placeholder="Enter your budget (e.g., 5000)"
                      min="0"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {currentStep === 3 ? (
              <div className="space-y-5">
                <div className="border-b border-line pb-4">
                  <h2 className="text-xl font-bold text-ink sm:text-2xl">Review your request</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
                    Make sure the key details are easy to understand before you post this job.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {[
                    { label: 'Title', value: formData.title, step: 1, tone: 'border-brand-100 bg-brand-50/75' },
                    { label: 'Service Type', value: selectedCategory?.label, step: 1, tone: 'border-blue-100 bg-blue-50/75' },
                    { label: 'Location', value: formData.locationArea, step: 1, tone: 'border-amber-100 bg-amber-50/75' },
                    { label: 'Budget', value: formData.budget || formData.budget === 0 ? formatBudget(formData.budget) : 'Not set', step: 2, tone: 'border-green-100 bg-green-50/75' },
                  ].map((item) => (
                    <div key={item.label} className={`rounded-card border px-4 py-4 shadow-soft ${item.tone}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="ui-stat-label">{item.label}</p>
                          <p className="mt-2 text-lg font-bold text-ink">{item.value || 'Not provided yet'}</p>
                        </div>
                        <button type="button" className="text-sm font-semibold text-brand-800 hover:text-brand-900" onClick={() => setCurrentStep(item.step)}>
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                  <div className="rounded-card border border-line bg-surface-muted/75 px-4 py-4 shadow-soft">
                    <p className="ui-stat-label">Urgency</p>
                    <div className="mt-3">
                      <StatusPill tone={selectedUrgency?.tone || 'info'}>{selectedUrgency?.label || 'Medium'}</StatusPill>
                    </div>
                    <button type="button" className="mt-4 text-sm font-semibold text-brand-800 hover:text-brand-900" onClick={() => setCurrentStep(2)}>
                      Edit urgency
                    </button>
                  </div>

                  <div className="rounded-card border border-line bg-surface-muted/75 px-4 py-4 shadow-soft">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="ui-stat-label">Description</p>
                        <p className="mt-2 text-sm leading-6 text-ink-muted">{previewText(formData.description)}</p>
                      </div>
                      <button type="button" className="text-sm font-semibold text-brand-800 hover:text-brand-900" onClick={() => setCurrentStep(2)}>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-card border border-brand-100 bg-brand-50/85 px-4 py-4 shadow-soft">
                  <h3 className="text-lg font-bold text-brand-900">Why this request will be easier to quote</h3>
                  <div className="mt-4 flex flex-wrap gap-3">
                    {[
                      formData.title ? 'Clear title' : 'Title still needed',
                      formData.locationArea ? 'Location included' : 'Location still needed',
                      formData.description.length >= 20 ? 'Strong description' : 'Description needs more detail',
                    ].map((item) => (
                      <span key={item} className="ui-badge">{item}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              {currentStep > 1 ? (
                <button type="button" className="ui-button-ghost w-full sm:w-auto" onClick={() => setCurrentStep((step) => step - 1)}>
                  Back
                </button>
              ) : <div />}

              {currentStep < 3 ? (
                <button
                  type="button"
                  className="ui-button-primary w-full sm:w-auto"
                  onClick={() => {
                    if (validateStep(currentStep)) {
                      setCurrentStep((step) => step + 1);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                  }}
                >
                  Next Step
                </button>
              ) : (
                <button type="button" className="ui-button-primary w-full sm:w-auto" onClick={handleSubmit} disabled={loading || success}>
                  {loading ? (isEditMode ? 'Updating...' : 'Posting...') : success ? (isEditMode ? 'Updated!' : 'Posted!') : (isEditMode ? 'Update Request' : 'Post Request')}
                </button>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default CreateRequestPage;
