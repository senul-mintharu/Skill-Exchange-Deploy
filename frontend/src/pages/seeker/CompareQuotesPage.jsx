import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';
import { getQuotesByRequest } from '../../services/quoteService';
import './CompareQuotesPage.css';

const CompareQuotesPage = () => {
    const { requestId } = useParams();
    const [quotes, setQuotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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

    useEffect(() => {
        const load = async () => {
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
        if (requestId) load();
    }, [requestId]);

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
            </main>
        </div>
    );
};

export default CompareQuotesPage;
