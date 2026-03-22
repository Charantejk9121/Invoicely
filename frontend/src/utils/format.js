import { format, formatDistanceToNow, isAfter } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount || 0);
};

export const formatDate = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd MMM yyyy');
};

export const formatDateShort = (date) => {
  if (!date) return '—';
  return format(new Date(date), 'dd/MM/yy');
};

export const formatRelative = (date) => {
  if (!date) return '—';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

export const isOverdue = (invoice) => {
  if (invoice.status !== 'pending') return false;
  if (!invoice.dueDate) return false;
  return !isAfter(new Date(invoice.dueDate), new Date());
};

export const getStatusBadgeClass = (status) => {
  const map = {
    paid: 'badge-paid',
    pending: 'badge-pending',
    overdue: 'badge-overdue',
    cancelled: 'badge-cancelled',
  };
  return map[status] || 'badge-pending';
};

export const getInitials = (name = '') => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const avatarColor = (name = '') => {
  const colors = [
    'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx];
};

export const truncate = (str, len = 30) => {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '...' : str;
};
