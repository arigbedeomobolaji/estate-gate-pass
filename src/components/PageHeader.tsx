import Link from 'next/link';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
  backHref?: string;
  backLabel?: string;
}

export default function PageHeader({ title, description, action, backHref, backLabel }: PageHeaderProps) {
  return (
    <div className="mb-7">
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm mb-3" style={{ color: 'var(--muted-foreground)' }}>
          ← {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight m-0" style={{ color: 'var(--afit-navy)' }}>{title}</h1>
          {description && <p className="text-sm mt-1 m-0" style={{ color: 'var(--muted-foreground)' }}>{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
