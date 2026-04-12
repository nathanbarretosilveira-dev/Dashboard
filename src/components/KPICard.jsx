const colorStyles = {
  blue: 'bg-blue-50 text-blue-700 border-blue-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  purple: 'bg-violet-50 text-violet-700 border-violet-100',
  navy: 'bg-slate-100 text-slate-800 border-slate-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function KPICard({ title, value, subtitle, icon: Icon, color = 'blue', className = '' }) {
  return (
    <div className={`rounded-xl border border-border bg-card p-4 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{title}</p>
          <p className="mt-1 text-lg font-bold text-foreground leading-tight">{value}</p>
          {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
        </div>
        {Icon ? (
          <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${colorStyles[color] || colorStyles.blue}`}>
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
