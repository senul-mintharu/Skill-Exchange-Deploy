import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ErrorBanner from '../../components/common/ErrorBanner';
import {
  EmptyState,
  LoadingPanel,
  PageIntro,
  SectionCard,
  StatusPill,
} from '../../components/ui/PortalPrimitives';
import { getAllUsers } from '../../services/adminService';

const roleOptions = [
  { value: '', label: 'All roles' },
  { value: 'SEEKER', label: 'Seekers' },
  { value: 'WORKER', label: 'Workers' },
  { value: 'ADMIN', label: 'Admins' },
];

const statusOptions = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const formatDate = (value) => {
  if (!value) return 'Unknown';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getRoleTone = (role) => {
  if (role === 'ADMIN') return 'danger';
  if (role === 'WORKER') return 'info';
  return 'success';
};

const getDisplayRole = (role) => {
  if (!role) return 'Unknown';
  return role.charAt(0) + role.slice(1).toLowerCase();
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const filters = useMemo(
    () => ({
      search: search.trim(),
      role,
      status,
    }),
    [search, role, status],
  );

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getAllUsers(filters);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load platform users.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const totals = useMemo(() => {
    const active = users.filter((user) => !user.isSuspended).length;
    const suspended = users.filter((user) => user.isSuspended).length;
    return { active, suspended, total: users.length };
  }, [users]);

  return (
    <div className="page-wrapper">
      <main className="ui-shell space-y-6">
        <PageIntro
          eyebrow="Admin"
          title="User Management"
          subtitle="Monitor registered seekers, workers, and admins across the LankaFIX platform."
          light
        />

        <SectionCard className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-ink">Registered Users</h2>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                Search by name, email, district, or phone number.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusPill tone="info" icon="groups">{totals.total} Users</StatusPill>
              <StatusPill tone="success" icon="check_circle">{totals.active} Active</StatusPill>
              <StatusPill tone="warning" icon="block">{totals.suspended} Suspended</StatusPill>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="ui-field">
              <label className="ui-label" htmlFor="admin-user-search">Search users</label>
              <div className="ui-input-icon-wrap">
                <span className="material-icons text-brand-700">search</span>
                <input
                  id="admin-user-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search name, email, district, or phone"
                />
              </div>
            </div>

            <div className="ui-field">
              <label className="ui-label" htmlFor="admin-role-filter">Role</label>
              <select
                id="admin-role-filter"
                className="ui-input"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {roleOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="ui-field">
              <label className="ui-label" htmlFor="admin-status-filter">Status</label>
              <select
                id="admin-status-filter"
                className="ui-input"
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                {statusOptions.map((option) => (
                  <option key={option.value || 'all'} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

          <ErrorBanner message={error} onClose={() => setError('')} />

          {loading ? <LoadingPanel message="Loading registered users..." /> : null}

          {!loading && users.length === 0 ? (
            <EmptyState
              icon="person_search"
              title="No users found."
              text="Try changing the search term or filters to see more platform users."
            />
          ) : null}

          {!loading && users.length > 0 ? (
            <div className="overflow-hidden rounded-panel border border-line bg-white shadow-card">
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white">
                  <thead className="bg-surface-muted">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">User</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">District</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.12em] text-ink-subtle">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-line transition hover:bg-brand-50/50">
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-ink">{user.fullName || 'Unnamed user'}</p>
                          <p className="mt-1 text-sm text-ink-muted">{user.email || 'No email available'}</p>
                          {user.phoneNumber ? <p className="mt-1 text-xs text-ink-subtle">{user.phoneNumber}</p> : null}
                        </td>
                        <td className="px-4 py-3">
                          <StatusPill tone={getRoleTone(user.role)}>{getDisplayRole(user.role)}</StatusPill>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{user.district || 'Not provided'}</td>
                        <td className="px-4 py-3">
                          <StatusPill tone={user.isSuspended ? 'warning' : 'success'} icon={user.isSuspended ? 'block' : 'check_circle'}>
                            {user.isSuspended ? 'Suspended' : 'Active'}
                          </StatusPill>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{formatDate(user.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </SectionCard>
      </main>
    </div>
  );
};

export default UserManagementPage;
