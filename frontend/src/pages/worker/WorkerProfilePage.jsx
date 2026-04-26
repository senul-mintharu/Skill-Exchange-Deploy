import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  WorkerProfileBackButton,
  WorkerProfileError,
  WorkerProfilePanel,
  WorkerProfileSkeleton,
} from '../../components/ui/WorkerProfilePanel';
import { AlertPanel } from '../../components/ui/PortalPrimitives';
import { getProfileById } from '../../services/profileService';
import { getReviewsForWorker } from '../../services/reviewService';

const WorkerProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfileById(id);
      setProfile(data);
      if (data?.userId) {
        try {
          const reviewData = await getReviewsForWorker(data.userId);
          setReviews(Array.isArray(reviewData) ? reviewData : []);
        } catch {
          setReviews([]);
        }
      }
    } catch (err) {
      setError('Failed to fetch profile. It might not exist.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (loading) return <WorkerProfileSkeleton />;

  if (error) {
    return (
      <WorkerProfileError
        message={error}
        action={<WorkerProfileBackButton to="/worker/dashboard" label="Back to Dashboard" />}
      />
    );
  }

  if (!profile) return null;

  const reg = String(profile.registrationPaymentStatus || 'APPROVED').toUpperCase();
  const paymentApproved = reg === 'APPROVED';
  const paymentUnderReview = reg === 'PAYMENT_UNDER_REVIEW';
  const paymentPending = reg === 'PENDING_PAYMENT';

  const notice = (
    <div className="mb-6 space-y-4">
      {location.state?.profileSubmitted && paymentUnderReview ? (
        <AlertPanel tone="info" icon="upload_file" title="Payment slip received" className="w-full">
          <p>
            Thank you. An administrator will review your registration payment. You&apos;ll be able to submit quotes
            once it&apos;s approved.
          </p>
        </AlertPanel>
      ) : null}
      {paymentUnderReview && !location.state?.profileSubmitted ? (
        <AlertPanel tone="warning" icon="hourglass_top" title="Registration payment under review" className="w-full">
          <p>Your profile is saved and your slip is with the admin team. We&apos;ll notify you here once it&apos;s approved.</p>
        </AlertPanel>
      ) : null}
      {paymentPending && profile.paymentRejectionNote ? (
        <AlertPanel tone="danger" icon="cancel" title="Payment slip needs a new upload" className="w-full">
          <p className="font-medium text-ink">{profile.paymentRejectionNote}</p>
          <button
            type="button"
            className="ui-button-primary mt-3"
            onClick={() => navigate(`/edit-profile/${profile.id}`)}
          >
            Upload a new slip
          </button>
        </AlertPanel>
      ) : null}
      {paymentPending && !profile.paymentRejectionNote ? (
        <AlertPanel tone="info" icon="account_balance" title="Finish registration payment" className="w-full">
          <p>Upload your bank transfer slip to send your profile for admin review.</p>
          <button
            type="button"
            className="ui-button-primary mt-3"
            onClick={() => navigate(`/edit-profile/${profile.id}`)}
          >
            Complete payment
          </button>
        </AlertPanel>
      ) : null}
    </div>
  );

  const hasAnyNotice =
    (location.state?.profileSubmitted && paymentUnderReview)
    || paymentUnderReview
    || paymentPending;

  return (
    <WorkerProfilePanel
      profile={profile}
      reviews={reviews}
      backLink={<WorkerProfileBackButton to="/worker/dashboard" label="Back to Dashboard" />}
      notice={hasAnyNotice ? notice : null}
      actions={(
        <>
          <button
            className="ui-button-primary w-full sm:w-auto"
            type="button"
            onClick={() => navigate('/worker/verification')}
            disabled={!paymentApproved}
          >
            <span className="material-icons text-base">verified_user</span>
            Verification
          </button>
          <button
            className="ui-button-primary w-full sm:w-auto"
            type="button"
            onClick={() => navigate('/browse-requests')}
            disabled={!paymentApproved}
          >
            <span className="material-icons text-base">travel_explore</span>
            Find Work
          </button>
          <button className="ui-button-secondary w-full sm:w-auto" type="button" onClick={() => navigate(`/edit-profile/${profile.id}`)}>
            <span className="material-icons text-base">edit</span>
            Edit Profile
          </button>
        </>
      )}
    />
  );
};

export default WorkerProfilePage;
