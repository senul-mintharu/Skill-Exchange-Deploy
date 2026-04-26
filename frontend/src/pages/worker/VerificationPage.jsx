import React, { useEffect, useRef, useState } from 'react';
import ErrorBanner from '../../components/common/ErrorBanner';
import { PageIntro, SectionCard, StatusPill } from '../../components/ui/PortalPrimitives';
import { getCurrentUser } from '../../services/authService';
import { getMyVerification, submitVerification } from '../../services/verificationService';
import { getApiErrorMessage } from '../../utils/formValidationMessages';
import { resolveHttpError } from '../../utils/httpErrors';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'pdf']);
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'application/pdf']);

const getStatusTone = (status) => {
  const normalized = String(status || 'NONE').toUpperCase();
  if (normalized === 'APPROVED') return 'success';
  if (normalized === 'PENDING') return 'warning';
  if (normalized === 'REJECTED') return 'danger';
  return 'info';
};

const getStatusLabel = (status) => {
  const normalized = String(status || 'NONE').toUpperCase();
  if (normalized === 'PENDING') return 'Verification Pending';
  if (normalized === 'APPROVED') return 'Verification Approved';
  if (normalized === 'REJECTED') return 'Verification Rejected';
  return 'Not Submitted';
};

const getStoredFileKey = (userId) => `worker-verification-file-${userId || 'unknown'}`;

const VerificationPage = () => {
  const currentUser = getCurrentUser();
  const successTimeoutRef = useRef(null);

  const [verificationStatus, setVerificationStatus] = useState('NONE');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Lock the form for both PENDING (awaiting review) and APPROVED (already verified)
  const isLocked = verificationStatus === 'PENDING' || verificationStatus === 'APPROVED';

  useEffect(() => {
    let ignore = false;

    const loadVerificationState = async () => {
      setError('');

      const fallbackName = localStorage.getItem(getStoredFileKey(currentUser?.id)) || '';
      if (!ignore) {
        setUploadedFileName(fallbackName);
      }

      if (!currentUser?.id) return;

      try {
        // Use the dedicated verification endpoint as the canonical source of truth.
        const data = await getMyVerification();
        const status = String(data?.verificationStatus || 'NONE').toUpperCase();
        const docName = data?.documentName || '';

        if (!ignore) {
          setVerificationStatus(status);
          if (docName) {
            setUploadedFileName(docName);
            localStorage.setItem(getStoredFileKey(currentUser?.id), docName);
          }
        }
      } catch (err) {
        // 404 means no submission yet — treat as NONE, not an error.
        if (err?.response?.status === 404) {
          return;
        }
        if (!ignore) {
          setError(resolveHttpError(err, 'Failed to load verification status.'));
        }
      }
    };

    loadVerificationState();

    return () => {
      ignore = true;
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, [currentUser?.id]);

  const clearFileSelection = (eventTarget) => {
    setSelectedFile(null);
    if (eventTarget) {
      eventTarget.value = '';
    }
  };

  const handleFileChange = (event) => {
    setError('');
    setSuccessMessage('');

    const file = event.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      clearFileSelection(event.target);
      setError('This file is over 5 MB. Please choose a smaller JPG, PNG, or PDF (max 5 MB).');
      return;
    }

    const fileName = file.name || '';
    const extension = fileName.includes('.')
      ? fileName.split('.').pop().toLowerCase()
      : '';
    const mimeType = String(file.type || '').toLowerCase();

    if (!ALLOWED_EXTENSIONS.has(extension) || !ALLOWED_MIME_TYPES.has(mimeType)) {
      clearFileSelection(event.target);
      setError('Only JPG, PNG, or PDF files are allowed. Check the file type and try again.');
      return;
    }

    setSelectedFile(file);
  };

  const showTemporarySuccess = (message) => {
    setSuccessMessage(message);
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
    }

    successTimeoutRef.current = setTimeout(() => {
      setSuccessMessage('');
    }, 3000);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isLocked || submitting) {
      return;
    }

    if (!selectedFile) {
      setError('Select a document (JPG, PNG, or PDF) using the file picker before submitting.');
      return;
    }

    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const result = await submitVerification(selectedFile);
      const nextStatus = String(result?.verificationStatus || 'PENDING').toUpperCase();
      const documentName = result?.documentName || selectedFile.name;

      setVerificationStatus(nextStatus);
      setUploadedFileName(documentName);
      setSelectedFile(null);
      localStorage.setItem(getStoredFileKey(currentUser?.id), documentName);
      showTemporarySuccess('Verification submitted successfully.');
    } catch (err) {
      setError(
        getApiErrorMessage(err, resolveHttpError(err, 'Could not upload your document. Please try again.'))
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Worker Dashboard"
          title="Worker Verification"
          subtitle="Upload your verification document so your profile can be reviewed by the admin team."
        />

        <SectionCard className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-ink">Verification Submission</h2>
            <StatusPill tone={getStatusTone(verificationStatus)} icon={verificationStatus === 'PENDING' ? 'hourglass_top' : 'verified_user'}>
              {getStatusLabel(verificationStatus)}
            </StatusPill>
          </div>

          <ErrorBanner message={error} onClose={() => setError('')} />
          <ErrorBanner
            message={successMessage}
            type="success"
            onClose={() => setSuccessMessage('')}
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="ui-field">
              <label htmlFor="verification-document" className="ui-label">
                Verification Document
              </label>
              <input
                id="verification-document"
                type="file"
                accept=".jpg,.png,.pdf"
                onChange={handleFileChange}
                disabled={isLocked || submitting}
                className="ui-input"
              />
              <p className="ui-helper">
                Accepted formats: JPG, PNG, PDF. Maximum size: 5MB.
              </p>
            </div>

            {selectedFile ? (
              <p className="text-sm text-ink-muted">
                Selected file: <span className="font-semibold text-ink">{selectedFile.name}</span>
              </p>
            ) : null}

            {isLocked && uploadedFileName ? (
              <p className="text-sm text-ink-muted">
                Uploaded file: <span className="font-semibold text-ink">{uploadedFileName}</span>
              </p>
            ) : null}

            <button
              type="submit"
              className="ui-button-primary"
              disabled={isLocked || submitting || !selectedFile}
            >
              {submitting
                ? 'Uploading...'
                : verificationStatus === 'APPROVED'
                ? 'Already Verified'
                : verificationStatus === 'PENDING'
                ? 'Pending Review'
                : 'Submit Verification'}
            </button>
          </form>
        </SectionCard>
      </main>
    </div>
  );
};

export default VerificationPage;
