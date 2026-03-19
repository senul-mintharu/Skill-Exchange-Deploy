import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';
import { getMyQuotes, withdrawQuote } from '../../services/quoteService';
import './MyQuotationsPage.css';

const statusMeta = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
        case 'PENDING':
            return { label: 'PENDING', tone: 'pending', icon: 'hourglass_top' };
        case 'ACCEPTED':
            return { label: 'ACCEPTED', tone: 'accepted', icon: 'check_circle' };
        case 'REJECTED':
            return { label: 'REJECTED', tone: 'rejected', icon: 'cancel' };
        case 'WITHDRAWN':
            return { label: 'WITHDRAWN', tone: 'withdrawn', icon: 'undo' };
        default:
            return { label: s || 'UNKNOWN', tone: 'unknown', icon: 'help_outline' };
    }
};

const MyQuotationsPage = () => {
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [banner, setBanner] = useState(null); // { type: 'success' | 'error', title, message }
    const [withdrawingId, setWithdrawingId] = useState(null);

    const hasQuotes = quotes && quotes.length > 0;

    const counts = useMemo(() => {
        const c = { total: quotes.length, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
        for (const q of quotes) {
            const s = String(q.status || '').toUpperCase();
            if (s === 'PENDING') c.pending += 1;
            else if (s === 'ACCEPTED') c.accepted += 1;
            else if (s === 'REJECTED') c.rejected += 1;
            else if (s === 'WITHDRAWN') c.withdrawn += 1;
        }
        return c;
    }, [quotes]);

    const load = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getMyQuotes();
            setQuotes(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load your quotations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleWithdraw = async (quote) => {
        setBanner(null);
        setWithdrawingId(quote.id);
        try {
            const updated = await withdrawQuote(quote.id);
            setQuotes(prev => prev.map(q => (q.id === updated.id ? updated : q)));
            setBanner({
                type: 'success',
                title: 'Quotation Withdrawn',
                message: 'Your quotation has been withdrawn successfully.',
            });
        } catch (err) {
            const backendMsg = err.response?.data?.message;
            const status = String(quote.status || '').toUpperCase();
            const restriction =
                status === 'ACCEPTED'
                    ? 'This quotation has already been accepted and cannot be withdrawn.'
                    : 'This quotation cannot be withdrawn in its current status.';

            setBanner({
                type: 'error',
                title: 'Withdrawal Not Allowed',
                message: backendMsg || restriction,
            });
        } finally {
            setWithdrawingId(null);
        }
    };

    return (
        <div className="page-wrapper">
            <main className="mq-container">
                <Breadcrumb />
                <PageHeader title="My Quotations" />

                {/* Summary */}
                <div className="mq-summary">
                    <div className="mq-stat">
                        <p className="mq-stat-label">Total</p>
                        <p className="mq-stat-value">{counts.total}</p>
                    </div>
                    <div className="mq-stat">
                        <p className="mq-stat-label">Pending</p>
                        <p className="mq-stat-value">{counts.pending}</p>
                    </div>
                    <div className="mq-stat">
                        <p className="mq-stat-label">Accepted</p>
                        <p className="mq-stat-value">{counts.accepted}</p>
                    </div>
                    <div className="mq-stat">
                        <p className="mq-stat-label">Rejected</p>
                        <p className="mq-stat-value">{counts.rejected}</p>
                    </div>
                    <div className="mq-stat">
                        <p className="mq-stat-label">Withdrawn</p>
                        <p className="mq-stat-value">{counts.withdrawn}</p>
                    </div>
                </div>

                {/* Banner */}
                {banner && (
                    <div className={`mq-banner mq-banner--${banner.type}`} role="alert">
                        <span className="material-icons mq-banner-icon">
                            {banner.type === 'success' ? 'check_circle' : 'error_outline'}
                        </span>
                        <div className="mq-banner-body">
                            <strong>{banner.title}</strong>
                            <p>{banner.message}</p>
                        </div>
                        <button
                            className="mq-banner-close"
                            onClick={() => setBanner(null)}
                            aria-label="Close message"
                            type="button"
                        >
                            <span className="material-icons">close</span>
                        </button>
                    </div>
                )}

                {/* Loading */}
                {loading && (
                    <div className="mq-loading">
                        <div className="mq-spinner" aria-hidden="true" />
                        <p>Loading your quotations…</p>
                    </div>
                )}

                {/* Error */}
                {!loading && error && (
                    <div className="mq-error">
                        <span className="material-icons">error_outline</span>
                        <div>
                            <h3>Couldn’t load quotations</h3>
                            <p>{error}</p>
                            <button className="mq-btn mq-btn-primary" onClick={load} type="button">
                                <span className="material-icons">refresh</span>
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Empty state (AC2) */}
                {!loading && !error && !hasQuotes && (
                    <div className="mq-empty">
                        <div className="mq-empty-card">
                            <div className="mq-empty-icon">
                                <span className="material-icons">request_quote</span>
                            </div>
                            <h2>No quotations submitted yet</h2>
                            <p>
                                When you submit quotations to service requests, they’ll show up here so you can track their status.
                            </p>
                            <Link to="/browse-requests" className="mq-btn mq-btn-primary">
                                <span className="material-icons">search</span>
                                Find Work
                            </Link>
                        </div>
                    </div>
                )}

                {/* List (AC1) */}
                {!loading && !error && hasQuotes && (
                    <div className="mq-list" aria-label="My quotations list">
                        {quotes.map((q) => {
                            const meta = statusMeta(q.status);
                            const isPending = meta.label === 'PENDING';
                            const isAccepted = meta.label === 'ACCEPTED';
                            const isBusy = withdrawingId === q.id;
                            const restrictionMsg = isAccepted
                                ? 'Accepted quotations cannot be withdrawn.'
                                : !isPending
                                    ? 'Only pending quotations can be withdrawn.'
                                    : null;

                            return (
                                <div key={q.id} className="mq-card">
                                    <div className="mq-card-top">
                                        <div className="mq-card-title">
                                            <h3 className="mq-request-title">{q.requestTitle || `Request #${q.requestId}`}</h3>
                                            <p className="mq-request-sub">
                                                <span className="material-icons">tag</span>
                                                Quote #{q.id}
                                            </p>
                                        </div>
                                        <span className={`mq-status mq-status--${meta.tone}`}>
                                            <span className="material-icons">{meta.icon}</span>
                                            {meta.label}
                                        </span>
                                    </div>

                                    <div className="mq-metrics">
                                        <div className="mq-metric">
                                            <p className="mq-metric-label">
                                                <span className="material-icons">payments</span> Price
                                            </p>
                                            <p className="mq-metric-value mq-price">
                                                LKR {Number(q.price).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="mq-metric">
                                            <p className="mq-metric-label">
                                                <span className="material-icons">schedule</span> ETA
                                            </p>
                                            <p className="mq-metric-value">
                                                {q.estimatedDays} {q.estimatedDays === 1 ? 'day' : 'days'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mq-actions">
                                        <Link className="mq-btn mq-btn-ghost" to={`/requests/${q.requestId}`}>
                                            <span className="material-icons">visibility</span>
                                            View Request
                                        </Link>

                                        <button
                                            className="mq-btn mq-btn-danger"
                                            type="button"
                                            disabled={isBusy}
                                            onClick={() => {
                                                if (!isPending) {
                                                    setBanner({
                                                        type: 'error',
                                                        title: 'Withdrawal Not Allowed',
                                                        message: restrictionMsg || 'This quotation cannot be withdrawn.',
                                                    });
                                                    return;
                                                }
                                                handleWithdraw(q);
                                            }}
                                            title={restrictionMsg || 'Withdraw this quotation'}
                                        >
                                            {isBusy ? (
                                                <>
                                                    <span className="mq-mini-spinner" aria-hidden="true" />
                                                    Withdrawing…
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-icons">undo</span>
                                                    Withdraw
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>
        </div>
    );
};

export default MyQuotationsPage;

