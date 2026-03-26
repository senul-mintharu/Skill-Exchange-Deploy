import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';
import { acceptQuote, getQuotesByRequest } from '../../services/quoteService';
import './CompareQuotesPage.css';

const CompareQuotesPage = () => {
    const { requestId } = useParams();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [actionError, setActionError] = useState('');
    const [confirmingQuote, setConfirmingQuote] = useState(null);
    const [acceptingId, setAcceptingId] = useState(null);

    const sorted = useMemo(() => {
        const list = Array.isArray(quotes) ? [...quotes] : [];
        // Default comparison sort: lowest price first, then fastest ETA
        list.sort((a, b) => {
            const ap = Number(a.price ?? 0);
            const bp = Number(b.price ?? 0);
            if (ap !== bp) return ap - bp;
            const ad = Number(a.estimatedDays ?? 0);
            const bd = Number(b.estimatedDays ?? 0);
            return ad - bd;
        });
        return list;
    }, [quotes]);

    const loadQuotes = async () => {
        setLoading(true);
        setError('');
        try {
            const data = await getQuotesByRequest(Number(requestId));
            setQuotes(Array.isArray(data) ? data : []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load quotations. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (requestId) loadQuotes();
    }, [requestId]);

    const handleConfirmAccept = async () => {
        if (!confirmingQuote?.id) return;
        setActionError('');
        setAcceptingId(confirmingQuote.id);
        try {
            await acceptQuote(confirmingQuote.id);
            setConfirmingQuote(null);
            await loadQuotes();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to accept quotation. Please try again.');
        } finally {
            setAcceptingId(null);
        }
    };

    const formatQuoteStatus = (status) => String(status || '').replaceAll('_', ' ');

    const hasQuotes = sorted.length > 0;

    return (
        <div className="page-wrapper">
            <main className="cq-container">
                <Breadcrumb />
                <div className="cq-topbar">
                    <Link to={`/my-requests/${requestId}`} className="cq-back">
                        <span className="material-icons">arrow_back</span>
                        Back to Request
                    </Link>
                </div>

                <PageHeader title="Quotations Received" />

                {loading && (
                    <div className="cq-loading">
                        <div className="cq-spinner" aria-hidden="true" />
                        <p>Loading quotations…</p>
                    </div>
                )}

                {!loading && error && (
                    <div className="cq-banner" role="alert">
                        <span className="material-icons">error_outline</span>
                        <div>
                            <h3>Couldn’t load quotations</h3>
                            <p>{error}</p>
                        </div>
                    </div>
                )}

                {!loading && !error && actionError && (
                    <div className="cq-banner" role="alert">
                        <span className="material-icons">error_outline</span>
                        <div>
                            <h3>Couldn’t accept quotation</h3>
                            <p>{actionError}</p>
                        </div>
                    </div>
                )}

                {/* Empty state (AC3) */}
                {!loading && !error && !hasQuotes && (
                    <div className="cq-empty">
                        <div className="cq-empty-card">
                            <div className="cq-empty-icon">
                                <span className="material-icons">request_quote</span>
                            </div>
                            <h2>No quotations received yet</h2>
                            <p>Workers haven’t submitted quotations for this request yet. Please check back soon.</p>
                        </div>
                    </div>
                )}

                {/* List/table (AC1, AC2, AC4) */}
                {!loading && !error && hasQuotes && (
                    <>
                        <div className="cq-table-wrap">
                            <table className="cq-table" aria-label="Quotations comparison table">
                                <thead>
                                    <tr>
                                        <th>Worker</th>
                                        <th>Price</th>
                                        <th>ETA</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sorted.map((q) => (
                                        <tr key={q.id}>
                                            <td data-label="Worker">
                                                <Link to={`/workers/${q.workerId}`} className="cq-worker">
                                                    <span className="cq-avatar" aria-hidden="true">
                                                        {(q.workerName || 'W').charAt(0).toUpperCase()}
                                                    </span>
                                                    <span>{q.workerName || `Worker #${q.workerId}`}</span>
                                                </Link>
                                            </td>
                                            <td data-label="Price" className="cq-price">
                                                LKR {Number(q.price).toLocaleString()}
                                            </td>
                                            <td data-label="ETA" className="cq-eta">
                                                {q.estimatedDays} {q.estimatedDays === 1 ? 'day' : 'days'}
                                            </td>
                                            <td data-label="Status">
                                                <span className={`cq-status cq-status-${String(q.status || '').toLowerCase().replace('_', '-')}`}>
                                                    {formatQuoteStatus(q.status)}
                                                </span>
                                            </td>
                                            <td data-label="Action">
                                                <button
                                                    type="button"
                                                    className="cq-accept-btn"
                                                    disabled={q.status === 'ACCEPTED' || acceptingId === q.id}
                                                    onClick={() => {
                                                        setActionError('');
                                                        setConfirmingQuote(q);
                                                    }}
                                                >
                                                    {acceptingId === q.id ? 'Accepting...' : q.status === 'ACCEPTED' ? 'Accepted' : 'Accept'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <p className="cq-footnote">
                            Tip: quotations are sorted by lowest price first (then fastest ETA).
                        </p>
                    </>
                )}

                {confirmingQuote && (
                    <div className="cq-modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="accept-quote-title">
                        <div className="cq-modal">
                            <h3 id="accept-quote-title">Accept this quotation?</h3>
                            <p>
                                You are about to accept <strong>{confirmingQuote.workerName || `Worker #${confirmingQuote.workerId}`}</strong>'s
                                quotation for <strong>LKR {Number(confirmingQuote.price).toLocaleString()}</strong>. This will close all other quotations.
                            </p>
                            <div className="cq-modal-actions">
                                <button
                                    type="button"
                                    className="cq-btn-secondary"
                                    disabled={acceptingId === confirmingQuote.id}
                                    onClick={() => setConfirmingQuote(null)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    className="cq-btn-primary"
                                    disabled={acceptingId === confirmingQuote.id}
                                    onClick={handleConfirmAccept}
                                >
                                    {acceptingId === confirmingQuote.id ? 'Accepting...' : 'Confirm Accept'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default CompareQuotesPage;
