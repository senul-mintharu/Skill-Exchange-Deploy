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

const WorkerProfilePage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getProfileById(id);
      setProfile(data);
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
        action={<WorkerProfileBackButton to="/browse-workers" label="Back to Workers" />}
      />
    );
  }

  if (!profile) return null;

  return (
    <WorkerProfilePanel
      profile={profile}
      backLink={<WorkerProfileBackButton to="/worker/dashboard" label="Back to Dashboard" />}
      notice={location.state?.profileCreated ? (
        <AlertPanel
          tone="success"
          icon="check_circle"
          title="Your worker profile is ready"
          action={<WorkerProfileBackButton to="/browse-requests" label="Find Work" />}
          className="mb-6"
        >
          <p>Start exploring jobs and submitting quotes whenever you&apos;re ready.</p>
        </AlertPanel>
      ) : null}
      actions={(
        <>
          <button className="ui-button-primary w-full sm:w-auto" type="button" onClick={() => navigate('/browse-requests')}>
            <span className="material-icons text-base">travel_explore</span>
            Find Work
          </button>
          <button className="ui-button-secondary w-full sm:w-auto" type="button" onClick={() => navigate(`/edit-profile/${profile.id}`)}>
            <span className="material-icons text-base">edit</span>
            Edit Profile
          </button>
          <button className="ui-button-ghost w-full sm:w-auto" type="button">
            <span className="material-icons text-base">share</span>
            Share
          </button>
        </>
      )}
    />
  );
};

export default WorkerProfilePage;
