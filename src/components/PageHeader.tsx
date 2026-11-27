import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

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
        <Link
          href={backHref}
          className="inline-flex items-center gap-1 text-sm font-medium mb-3 transition-colors hover:opacity-80"
          style={{ color: 'var(--afit-navy)' }}
        >
          <ChevronLeft size={15} />
          {backLabel ?? 'Back'}
        </Link>
      )}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight m-0" style={{ color: 'var(--afit-navy)' }}>{title}</h1>
          {description && <p className="text-sm mt-1 m-0" style={{ color: 'var(--muted-foreground)' }}>{description}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}
