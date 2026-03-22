import { CheckCircle2, Clock, AlertCircle, XCircle } from 'lucide-react';

const config = {
  paid: { cls: 'badge-paid', icon: CheckCircle2, label: 'Paid' },
  pending: { cls: 'badge-pending', icon: Clock, label: 'Pending' },
  overdue: { cls: 'badge-overdue', icon: AlertCircle, label: 'Overdue' },
  cancelled: { cls: 'badge-cancelled', icon: XCircle, label: 'Cancelled' },
};

export default function StatusBadge({ status }) {
  const { cls, icon: Icon, label } = config[status] || config.pending;
  return (
    <span className={cls}>
      <Icon size={10} />
      {label}
    </span>
  );
}
