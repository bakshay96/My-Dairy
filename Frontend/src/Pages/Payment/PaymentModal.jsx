import React, { useState } from 'react';
import useRazorpay from '../../hooks/useRazorpay';

/**
 * PaymentModal — Reusable payment initiation modal.
 *
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 *   farmerId?: string
 *   farmerName?: string
 *   farmerEmail?: string
 *   farmerPhone?: string
 *   defaultAmount?: number
 *   onPaymentSuccess?: (data) => void
 */
const PaymentModal = ({
  isOpen,
  onClose,
  farmerId = null,
  farmerName = '',
  farmerEmail = '',
  farmerPhone = '',
  defaultAmount = '',
  onPaymentSuccess,
}) => {
  const [amount, setAmount] = useState(defaultAmount || '');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { initiatePayment } = useRazorpay();

  if (!isOpen) return null;

  const validate = () => {
    const newErrors = {};
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than ₹0';
    }
    if (parseFloat(amount) > 500000) {
      newErrors.amount = 'Amount cannot exceed ₹5,00,000 per transaction';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    await initiatePayment({
      amount: parseFloat(amount),
      description: description || `Payment to ${farmerName || 'farmer'}`,
      farmerId,
      prefill: {
        name: farmerName,
        email: farmerEmail,
        contact: farmerPhone,
      },
      onSuccess: (data) => {
        setLoading(false);
        onPaymentSuccess?.(data);
        handleClose();
      },
      onFailure: () => {
        setLoading(false);
      },
    });
  };

  const handleClose = () => {
    setAmount(defaultAmount || '');
    setDescription('');
    setErrors({});
    setLoading(false);
    onClose();
  };

  const quickAmounts = [100, 500, 1000, 2500, 5000];

  return (
    <div style={styles.overlay} onClick={handleClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <div style={styles.iconWrap}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            </div>
            <div>
              <h2 style={styles.title}>Make Payment</h2>
              {farmerName && <p style={styles.subtitle}>To: {farmerName}</p>}
            </div>
          </div>
          <button onClick={handleClose} style={styles.closeBtn} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} style={styles.body}>
          {/* Amount */}
          <div style={styles.field}>
            <label style={styles.label}>Amount (₹) *</label>
            <div style={styles.amountInputWrap}>
              <span style={styles.currencySymbol}>₹</span>
              <input
                id="payment-amount"
                type="number"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (errors.amount) setErrors({});
                }}
                placeholder="0.00"
                min="1"
                step="0.01"
                style={{
                  ...styles.amountInput,
                  borderColor: errors.amount ? '#ef4444' : '#e2e8f0',
                }}
                autoFocus
              />
            </div>
            {errors.amount && <p style={styles.errorText}>{errors.amount}</p>}

            {/* Quick amount chips */}
            <div style={styles.quickAmounts}>
              {quickAmounts.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setAmount(q)}
                  style={{
                    ...styles.chip,
                    ...(parseFloat(amount) === q ? styles.chipActive : {}),
                  }}
                >
                  ₹{q.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description (optional)</label>
            <input
              id="payment-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly milk payment"
              maxLength={100}
              style={styles.input}
            />
          </div>

          {/* Security note */}
          <div style={styles.securityNote}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Secured by Razorpay · 256-bit SSL encryption</span>
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button type="button" onClick={handleClose} style={styles.cancelBtn} disabled={loading}>
              Cancel
            </button>
            <button type="submit" style={styles.payBtn} disabled={loading || !amount}>
              {loading ? (
                <span style={styles.loadingWrap}>
                  <span style={styles.spinner} /> Processing...
                </span>
              ) : (
                `Pay ₹${amount ? parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '0.00'}`
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{spinnerStyle}</style>
    </div>
  );
};

const spinnerStyle = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '16px',
  },
  modal: {
    background: '#ffffff',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 25px 60px rgba(0,0,0,0.18)',
    overflow: 'hidden',
    animation: 'none',
  },
  header: {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  iconWrap: {
    background: 'rgba(255,255,255,0.18)',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
  },
  title: {
    margin: 0,
    fontSize: '20px',
    fontWeight: 700,
    color: '#ffffff',
    letterSpacing: '-0.3px',
  },
  subtitle: {
    margin: '2px 0 0',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.8)',
  },
  closeBtn: {
    background: 'rgba(255,255,255,0.15)',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '16px',
    borderRadius: '8px',
    width: '34px',
    height: '34px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  body: {
    padding: '28px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#374151',
    letterSpacing: '0.02em',
    textTransform: 'uppercase',
  },
  amountInputWrap: {
    display: 'flex',
    alignItems: 'center',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'border-color 0.2s',
  },
  currencySymbol: {
    padding: '0 14px',
    fontSize: '20px',
    fontWeight: 700,
    color: '#2563eb',
    background: '#f0f4ff',
    alignSelf: 'stretch',
    display: 'flex',
    alignItems: 'center',
    borderRight: '2px solid #e2e8f0',
  },
  amountInput: {
    flex: 1,
    padding: '14px 16px',
    fontSize: '22px',
    fontWeight: 700,
    border: 'none',
    outline: 'none',
    color: '#0f172a',
    background: 'transparent',
  },
  input: {
    padding: '12px 16px',
    fontSize: '15px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    outline: 'none',
    color: '#374151',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },
  errorText: {
    margin: 0,
    fontSize: '12px',
    color: '#ef4444',
    fontWeight: 500,
  },
  quickAmounts: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginTop: '4px',
  },
  chip: {
    padding: '6px 14px',
    border: '2px solid #e2e8f0',
    borderRadius: '999px',
    background: 'transparent',
    fontSize: '13px',
    fontWeight: 600,
    color: '#4b5563',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chipActive: {
    borderColor: '#2563eb',
    background: '#eff6ff',
    color: '#2563eb',
  },
  securityNote: {
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
    fontSize: '12px',
    color: '#16a34a',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '8px 12px',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '4px',
  },
  cancelBtn: {
    flex: 1,
    padding: '13px',
    background: '#f1f5f9',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  payBtn: {
    flex: 2,
    padding: '13px',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: 700,
    color: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 4px 15px rgba(37,99,235,0.35)',
    letterSpacing: '0.02em',
  },
  loadingWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    borderRadius: '50%',
    display: 'inline-block',
    animation: 'spin 0.8s linear infinite',
  },
};

export default PaymentModal;
