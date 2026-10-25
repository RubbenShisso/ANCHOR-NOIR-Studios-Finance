export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
    </header>
  );
}

export function StatTile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: React.ReactNode;
}) {
  return (
    <div className="card">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {note && <p className="mt-1 text-xs text-ink-2">{note}</p>}
    </div>
  );
}
