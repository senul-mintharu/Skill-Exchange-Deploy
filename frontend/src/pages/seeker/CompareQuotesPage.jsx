import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Breadcrumb from '../../components/common/Breadcrumb';
import PageHeader from '../../components/common/PageHeader';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { acceptQuote, getQuotesByRequest } from '../../services/quoteService';

const statusTone = (status) => {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACCEPTED') return 'success';
  if (normalized === 'PENDING') return 'warning';
  if (normalized === 'REJECTED' || normalized === 'NOT_ACCEPTED') return 'danger';
  return 'neutral';
};

const CompareQuotesPage = () => {
  const { requestId } = useParams();
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [confirmingQuote, setConfirmingQuote] = useState(null);
  const [acceptingId, setAcceptingId] = useState(null);
  const [acceptedQuote, setAcceptedQuote] = useState(null);

  const sortedQuotes = useMemo(() => {
    const list = Array.isArray(quotes) ? [...quotes] : [];
    list.sort((a, b) => {
      const aPrice = Number(a.price ?? 0);
      const bPrice = Number(b.price ?? 0);
      if (aPrice !== bPrice) return aPrice - bPrice;
      const aDays = Number(a.estimatedDays ?? 0);
      const bDays = Number(b.estimatedDays ?? 0);
      return aDays - bDays;
    });
    return list;
  }, [quotes]);

  const loadQuotes = useCallback(async () => {
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
  }, [requestId]);

  useEffect(() => {
    if (requestId) loadQuotes();
  }, [loadQuotes, requestId]);

  const handleConfirmAccept = async () => {
    if (!confirmingQuote?.id) return;
    setActionError('');
    setAcceptingId(confirmingQuote.id);
    try {
      await acceptQuote(confirmingQuote.id);
      setAcceptedQuote(confirmingQuote);
      setConfirmingQuote(null);
      await loadQuotes();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to accept quotation. Please try again.');
    } finally {
      setAcceptingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-4">
        <Breadcrumb />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <PageHeader title="Quotations Received" />
            <p className="text-sm text-white/75">Compare offers, timing, and the best fit for your request.</p>
          </div>
          <Link to={`/my-requests/${requestId}`} className="ui-button-secondary w-full sm:w-auto">
            <span className="material-icons text-base">arrow_back</span>
            Back to Request
          </Link>
        </div>

        {loading ? <LoadingPanel message="Loading quotations…" /> : null}

        {!loading && error ? (
          <AlertPanel tone="danger" icon="error_outline" title="Couldn’t load quotations">
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && actionError ? (
          <AlertPanel tone="danger" icon="error_outline" title="Couldn’t accept quotation">
            <p>{actionError}</p>
          </AlertPanel>
        ) : null}

        {acceptedQuote ? (
          <AlertPanel
            tone="success"
            icon="check_circle"
            title="Quotation accepted"
            action={(
              <Link to={`/my-requests/${requestId}`} className="ui-button-primary w-full sm:w-auto">
                Continue as Seeker
              </Link>
            )}
          >
            <p>
              You accepted <strong>{acceptedQuote.workerName || `Worker #${acceptedQuote.workerId}`}</strong>&apos;s quotation.
              Open the request details to track the job, mark it completed, and leave a review when the work is done.
            </p>
          </AlertPanel>
        ) : null}

        {!loading && !error && sortedQuotes.length === 0 ? (
          <EmptyState
            icon="request_quote"
            title="No quotations received yet"
            text="Workers haven’t submitted quotations for this request yet. Please check back soon."
          />
        ) : null}

        {!loading && !error && sortedQuotes.length > 0 ? (
          <>
            <div className="ui-card overflow-hidden">
              <div className="border-b border-line bg-white px-4 py-3 sm:px-5">
                <p className="text-sm font-medium text-ink-muted">
                  Tip: quotations are sorted by lowest price first, then fastest ETA.
                </p>
              </div>

              <div className="hidden grid-cols-[2.2fr_1fr_1fr_1fr_1.1fr] gap-4 border-b border-line bg-surface-muted px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle lg:grid">
                <span>Worker</span>
                <span>Price</span>
                <span>ETA</span>
                <span>Status</span>
                <span>Action</span>
              </div>

              <div className="divide-y divide-line">
                {sortedQuotes.map((quote) => {
                  const workerName = quote.workerName || `Worker #${quote.workerId}`;
                  const isAccepted = quote.status === 'ACCEPTED';
                  const isBusy = acceptingId === quote.id;
                  return (
                    <article
                      key={quote.id}
                      className="grid gap-3 px-4 py-4 sm:px-5 lg:grid-cols-[2.2fr_1fr_1fr_1fr_1.1fr] lg:items-center"
                    >
                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle lg:hidden">Worker</p>
                        {quote.workerProfileId ? (
                          <Link to={`/workers/${quote.workerProfileId}`} className="inline-flex items-center gap-3 font-semibold text-ink transition hover:text-brand-800">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-sm font-bold text-white">
                              {workerName.charAt(0).toUpperCase()}
                            </span>
                            <span>{workerName}</span>
                          </Link>
                        ) : (
                          <div className="inline-flex items-center gap-3 font-semibold text-ink">
                            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-gradient text-sm font-bold text-white">
                              {workerName.charAt(0).toUpperCase()}
                            </span>
                            <span>{workerName}</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle lg:hidden">Price</p>
                        <p className="text-base font-extrabold text-brand-800 sm:text-lg">
                          LKR {Number(quote.price).toLocaleString()}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle lg:hidden">ETA</p>
                        <p className="text-sm font-semibold text-ink">
                          {quote.estimatedDays} {quote.estimatedDays === 1 ? 'day' : 'days'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle lg:hidden">Status</p>
                        <StatusPill tone={statusTone(quote.status)}>
                          {String(quote.status || '').replaceAll('_', ' ')}
                        </StatusPill>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-subtle lg:hidden">Action</p>
                        <button
                          type="button"
                          className={isAccepted ? 'ui-button-ghost w-full' : 'ui-button-primary w-full'}
                          disabled={isAccepted || isBusy}
                          onClick={() => {
                            setActionError('');
                            setConfirmingQuote(quote);
                          }}
                        >
                          {isBusy ? 'Accepting...' : isAccepted ? 'Accepted' : 'Accept'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}

        {confirmingQuote ? (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/55 px-4">
            <div className="ui-panel w-full max-w-lg p-5 sm:p-6">
              <h3 className="text-xl font-bold text-ink sm:text-2xl">Accept this quotation?</h3>
              <p className="mt-3 text-sm leading-6 text-ink-muted">
                You are about to accept <strong>{confirmingQuote.workerName || `Worker #${confirmingQuote.workerId}`}</strong>&apos;s
                quotation for <strong>LKR {Number(confirmingQuote.price).toLocaleString()}</strong>. This will close all other quotations.
              </p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="ui-button-ghost flex-1"
                  disabled={acceptingId === confirmingQuote.id}
                  onClick={() => setConfirmingQuote(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ui-button-primary flex-1"
                  disabled={acceptingId === confirmingQuote.id}
                  onClick={handleConfirmAccept}
                >
                  {acceptingId === confirmingQuote.id ? 'Accepting...' : 'Confirm Accept'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default CompareQuotesPage;
