export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'var(--bg-secondary)' }}>
        <Icon size={28} style={{ color: 'var(--text-secondary)' }} />
      </div>
      <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      <p className="text-sm mb-6 max-w-xs" style={{ color: 'var(--text-secondary)' }}>{description}</p>
      {action}
    </div>
  );
}
