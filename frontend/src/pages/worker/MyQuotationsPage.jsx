import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertPanel,
  EmptyState,
  LoadingPanel,
  PageIntro,
  StatCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { getMyQuotes, withdrawQuote } from '../../services/quoteService';

const statusMeta = (status) => {
  const normalized = String(status || '').toUpperCase();
  switch (normalized) {
    case 'PENDING':
      return { label: 'Pending', tone: 'warning', icon: 'hourglass_top' };
    case 'ACCEPTED':
      return { label: 'Accepted', tone: 'success', icon: 'check_circle' };
    case 'REJECTED':
    case 'NOT_ACCEPTED':
      return { label: 'Rejected', tone: 'danger', icon: 'cancel' };
    case 'WITHDRAWN':
      return { label: 'Withdrawn', tone: 'neutral', icon: 'undo' };
    default:
      return { label: normalized || 'Unknown', tone: 'neutral', icon: 'help_outline' };
  }
};

const MyQuotationsPage = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [banner, setBanner] = useState(null);
  const [withdrawingId, setWithdrawingId] = useState(null);

  const counts = useMemo(() => {
    const summary = { total: quotes.length, pending: 0, accepted: 0, rejected: 0, withdrawn: 0 };
    for (const quote of quotes) {
      const status = String(quote.status || '').toUpperCase();
      if (status === 'PENDING') summary.pending += 1;
      else if (status === 'ACCEPTED') summary.accepted += 1;
      else if (status === 'REJECTED' || status === 'NOT_ACCEPTED') summary.rejected += 1;
      else if (status === 'WITHDRAWN') summary.withdrawn += 1;
    }
    return summary;
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
      setQuotes((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setBanner({
        type: 'success',
        title: 'Quotation Withdrawn',
        message: 'Your quotation has been withdrawn successfully.',
      });
    } catch (err) {
      const backendMsg = err.response?.data?.message;
      const status = String(quote.status || '').toUpperCase();
      const restriction = status === 'ACCEPTED'
        ? 'This quotation has already been accepted and cannot be withdrawn.'
        : 'This quotation cannot be withdrawn in its current status.';

      setBanner({
        type: 'danger',
        title: 'Withdrawal Not Allowed',
        message: backendMsg || restriction,
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-5">
        <PageIntro
          eyebrow="Worker Quotations"
          title="My Quotations"
          subtitle="Review every submitted offer, keep an eye on pending decisions, and withdraw only when it still makes sense."
          light
          actions={(
            <Link to="/browse-requests" className="ui-button-primary w-full sm:w-auto">
              <span className="material-icons text-base">travel_explore</span>
              Find Work
            </Link>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard label="Total" value={counts.total} icon="request_quote" tone="brand" compact />
          <StatCard label="Pending" value={counts.pending} icon="hourglass_top" tone="warning" compact />
          <StatCard label="Accepted" value={counts.accepted} icon="check_circle" tone="success" compact />
          <StatCard label="Rejected" value={counts.rejected} icon="cancel" tone="danger" compact />
          <StatCard label="Withdrawn" value={counts.withdrawn} icon="undo" tone="neutral" compact />
        </div>

        {banner ? (
          <AlertPanel
            tone={banner.type}
            icon={banner.type === 'success' ? 'check_circle' : 'error_outline'}
            title={banner.title}
            onClose={() => setBanner(null)}
          >
            <p>{banner.message}</p>
          </AlertPanel>
        ) : null}

        {loading ? <LoadingPanel message="Loading your quotations…" /> : null}

        {!loading && error ? (
          <AlertPanel
            tone="danger"
            icon="error_outline"
            title="Couldn’t load quotations"
            action={<button className="ui-button-primary" onClick={load} type="button">Try Again</button>}
          >
            <p>{error}</p>
          </AlertPanel>
        ) : null}

        {!loading && !error && quotes.length === 0 ? (
          <EmptyState
            icon="request_quote"
            title="No quotations submitted yet"
            text="When you submit quotations to service requests, they’ll show up here so you can track their status."
            action={<Link to="/browse-requests" className="ui-button-primary">Find Work</Link>}
          />
        ) : null}

        {!loading && !error && quotes.length > 0 ? (
          <ul className="overflow-hidden rounded-panel border border-line bg-white shadow-card divide-y divide-line">
            {quotes.map((quote) => {
              const meta = statusMeta(quote.status);
              const isPending = meta.label.toUpperCase() === 'PENDING';
              const isAccepted = meta.label.toUpperCase() === 'ACCEPTED';
              const isBusy = withdrawingId === quote.id;
              const restrictionMessage = isAccepted
                ? 'Accepted quotations cannot be withdrawn.'
                : !isPending
                  ? 'Only pending quotations can be withdrawn.'
                  : null;

              return (
                <li key={quote.id} className="p-4 sm:p-5">
                  <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="ui-badge-muted">Quote #{quote.id}</span>
                        <StatusPill tone={meta.tone} icon={meta.icon}>
                          {meta.label}
                        </StatusPill>
                      </div>
                      <h3 className="text-lg font-bold text-ink">
                        {quote.requestTitle || `Request #${quote.requestId}`}
                      </h3>
                      <p className="text-sm leading-6 text-ink-muted">
                        Keep this quotation clear and current so you can react quickly if the seeker follows up.
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-extrabold tracking-tight text-ink">LKR {Number(quote.price).toLocaleString()}</p>
                      <p className="ui-stat-label">Quoted Price</p>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-card border border-brand-100 bg-brand-50/50 px-4 py-3">
                      <p className="ui-stat-label">Price</p>
                      <p className="mt-2 text-lg font-extrabold text-brand-800">
                        LKR {Number(quote.price).toLocaleString()}
                      </p>
                    </div>
                    <div className="rounded-card border border-line bg-surface-muted px-4 py-3">
                      <p className="ui-stat-label">ETA</p>
                      <p className="mt-2 text-lg font-bold text-ink">
                        {quote.estimatedDays} {quote.estimatedDays === 1 ? 'day' : 'days'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col gap-3 border-t border-line/70 pt-3 sm:flex-row">
                    <Link className="ui-button-ghost flex-1" to={`/requests/${quote.requestId}`}>
                      <span className="material-icons text-base">visibility</span>
                      View Request
                    </Link>

                    <button
                      className="ui-button-danger flex-1"
                      type="button"
                      disabled={isBusy}
                      onClick={() => {
                        if (!isPending) {
                          setBanner({
                            type: 'danger',
                            title: 'Withdrawal Not Allowed',
                            message: restrictionMessage || 'This quotation cannot be withdrawn.',
                          });
                          return;
                        }
                        handleWithdraw(quote);
                      }}
                      title={restrictionMessage || 'Withdraw this quotation'}
                    >
                      {isBusy ? (
                        <>
                          <div className="ui-spinner !h-4 !w-4 border-white/35 border-t-white" aria-hidden="true" />
                          Withdrawing...
                        </>
                      ) : (
                        <>
                          <span className="material-icons text-base">undo</span>
                          Withdraw
                        </>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </main>
    </div>
  );
};

export default MyQuotationsPage;
