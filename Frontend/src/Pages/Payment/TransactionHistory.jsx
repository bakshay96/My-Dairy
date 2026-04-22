import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-toastify';

const STATUS_COLORS = {
  captured:   { bg: '#f0fdf4', text: '#16a34a', border: '#86efac' },
  failed:     { bg: '#fef2f2', text: '#dc2626', border: '#fca5a5' },
  created:    { bg: '#fffbeb', text: '#d97706', border: '#fcd34d' },
  authorized: { bg: '#eff6ff', text: '#2563eb', border: '#93c5fd' },
  refunded:   { bg: '#faf5ff', text: '#7c3aed', border: '#c4b5fd' },
};

const formatAmount = (paise) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(paise / 100);

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

const TransactionHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [stats, setStats] = useState(null);

  const fetchPayments = async (currentPage = 1, status = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, pageSize: 10 });
      if (status) params.append('status', status);

      const { data } = await api.get(`/payment/history?${params}`);
      setPayments(data.payments || []);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/payment/stats');
      setStats(data.stats);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchPayments(page, statusFilter);
  }, [page, statusFilter]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleFilterChange = (status) => {
    setStatusFilter(status);
    setPage(1);
  };

  return (
    <div style={styles.container}>
      {/* Stats Bar */}
      {stats && (
        <div style={styles.statsBar}>
          <StatCard label="Total Transactions" value={stats.total} icon="📊" color="#2563eb" />
          <StatCard label="Successful" value={stats.captured || 0} icon="✅" color="#16a34a" />
          <StatCard label="Revenue Collected" value={formatAmount((stats.capturedAmount || 0) * 100)} icon="💰" color="#7c3aed" isAmount />
          <StatCard label="Failed" value={stats.failed || 0} icon="❌" color="#dc2626" />
        </div>
      )}

      {/* Page Header */}
      <div style={styles.pageHeader}>
        <h2 style={styles.pageTitle}>Transaction History</h2>
        <div style={styles.filters}>
          {['', 'captured', 'created', 'failed'].map((s) => (
            <button
              key={s}
              onClick={() => handleFilterChange(s)}
              style={{
                ...styles.filterBtn,
                ...(statusFilter === s ? styles.filterBtnActive : {}),
              }}
            >
              {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinnerLg} />
          <p>Loading transactions…</p>
        </div>
      ) : payments.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>💳</div>
          <h3 style={styles.emptyTitle}>No transactions found</h3>
          <p style={styles.emptyText}>
            {statusFilter ? `No ${statusFilter} payments yet.` : 'No payment records yet.'}
          </p>
        </div>
      ) : (
        <div style={styles.tableWrap}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thead}>
                <th style={styles.th}>Order ID</th>
                <th style={styles.th}>Farmer</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Date</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => {
                const statusStyle = STATUS_COLORS[p.status] || STATUS_COLORS.created;
                return (
                  <tr key={p._id} style={{ ...styles.row, background: idx % 2 === 0 ? '#fff' : '#f8fafc' }}>
                    <td style={styles.td}>
                      <code style={styles.orderId}>{p.razorpayOrderId?.slice(-12) || '—'}</code>
                    </td>
                    <td style={styles.td}>
                      {p.farmerId ? (
                        <div>
                          <div style={styles.farmerName}>{p.farmerId.name || '—'}</div>
                          <div style={styles.farmerPhone}>{p.farmerId.mobile || ''}</div>
                        </div>
                      ) : (
                        <span style={styles.naText}>—</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.amountText}>{formatAmount(p.amount)}</span>
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.badge,
                          background: statusStyle.bg,
                          color: statusStyle.text,
                          border: `1px solid ${statusStyle.border}`,
                        }}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <span style={styles.dateText}>{formatDate(p.createdAt)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={styles.pagination}>
          <button
            style={{ ...styles.pageBtn, opacity: page === 1 ? 0.4 : 1 }}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Prev
          </button>
          <span style={styles.pageInfo}>
            Page {page} of {totalPages}
          </span>
          <button
            style={{ ...styles.pageBtn, opacity: page === totalPages ? 0.4 : 1 }}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }) => (
  <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
    <div style={styles.statIcon}>{icon}</div>
    <div>
      <div style={{ ...styles.statValue, color }}>{value}</div>
      <div style={styles.statLabel}>{label}</div>
    </div>
  </div>
);

const styles = {
  container: { padding: '0', fontFamily: 'Inter, system-ui, sans-serif' },
  statsBar: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#fff',
    borderRadius: '14px',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  statIcon: { fontSize: '28px' },
  statValue: { fontSize: '22px', fontWeight: 800, letterSpacing: '-0.5px' },
  statLabel: { fontSize: '12px', color: '#6b7280', fontWeight: 500, marginTop: '2px' },
  pageHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  pageTitle: { margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' },
  filters: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn: {
    padding: '7px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '999px',
    background: 'transparent',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  filterBtnActive: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    color: '#2563eb',
  },
  tableWrap: {
    borderRadius: '14px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thead: { background: '#f8fafc' },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.07em',
    borderBottom: '1px solid #e2e8f0',
  },
  row: { transition: 'background 0.1s' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f1f5f9', verticalAlign: 'middle' },
  orderId: {
    fontFamily: 'monospace',
    fontSize: '12px',
    background: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '6px',
    color: '#475569',
  },
  farmerName: { fontSize: '14px', fontWeight: 600, color: '#0f172a' },
  farmerPhone: { fontSize: '12px', color: '#94a3b8', marginTop: '2px' },
  naText: { color: '#94a3b8', fontSize: '14px' },
  amountText: { fontSize: '15px', fontWeight: 700, color: '#0f172a' },
  badge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  dateText: { fontSize: '13px', color: '#64748b' },
  pagination: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    marginTop: '24px',
  },
  pageBtn: {
    padding: '9px 18px',
    background: '#fff',
    border: '2px solid #e2e8f0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '14px',
    color: '#374151',
    transition: 'all 0.15s',
  },
  pageInfo: { fontSize: '14px', color: '#6b7280', fontWeight: 500 },
  loadingState: {
    padding: '60px',
    textAlign: 'center',
    color: '#94a3b8',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
  },
  spinnerLg: {
    width: '36px', height: '36px',
    border: '3px solid #e2e8f0',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  emptyState: {
    padding: '60px',
    textAlign: 'center',
  },
  emptyIcon: { fontSize: '52px', marginBottom: '16px' },
  emptyTitle: { margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#374151' },
  emptyText: { margin: 0, color: '#94a3b8', fontSize: '14px' },
};

export default TransactionHistory;
