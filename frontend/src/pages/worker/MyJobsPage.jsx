import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';
import { getMyAssignedJobs } from '../../services/requestService';
import './MyJobsPage.css';

const statusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'ASSIGNED':
            return { label: 'Assigned', tone: 'assigned' };
        case 'IN_PROGRESS':
            return { label: 'In Progress', tone: 'in-progress' };
        case 'COMPLETED':
            return { label: 'Completed', tone: 'completed' };
        default:
            return { label: s || 'Unknown', tone: 'unknown' };
    }
};

const MyJobsPage = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyAssignedJobs();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load assigned jobs. Please try again.');
            setJobs([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div className="page-wrapper">
            <main className="mj-container">
                <Breadcrumb />
                <PageHeader title="My Jobs" />

                {loading && (
                    <div className="mj-loading">
                        <div className="mj-spinner" aria-hidden="true" />
                        <p>Loading assigned jobs...</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="mj-error" role="alert">
                        <span className="material-icons">error_outline</span>
                        <div>
                            <h3>Couldn’t load jobs</h3>
                            <p>{error}</p>
                            <button className="mj-btn" type="button" onClick={load}>
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {!loading && !error && jobs.length === 0 && (
                    <div className="mj-empty">
                        <div className="mj-empty-card">
                            <span className="material-icons mj-empty-icon">work_off</span>
                            <h2>No assigned jobs yet</h2>
                            <p>Your accepted jobs will appear here once a seeker assigns work to you.</p>
                            <Link to="/browse-requests" className="mj-btn mj-btn-link">Browse Requests</Link>
                        </div>
                    </div>
                )}

                {!loading && !error && jobs.length > 0 && (
                    <div className="mj-list" aria-label="Assigned jobs list">
                        {jobs.map((job) => {
                            const meta = statusMeta(job.status);
                            return (
                                <Link key={job.requestId} to={`/requests/${job.requestId}`} className="mj-card">
                                    <div className="mj-card-head">
                                        <h3 className="mj-title">{job.requestTitle || `Request #${job.requestId}`}</h3>
                                        <span className={`mj-status mj-status--${meta.tone}`}>{meta.label}</span>
                                    </div>
                                    <p className="mj-subtitle">
                                        <span className="material-icons">person</span>
                                        Seeker: {job.seekerName || 'Unknown'}
                                    </p>
                                    <p className="mj-view">View job details</p>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyJobsPage;
