import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-9 w-full appearance-none rounded-lg border border-input bg-white pl-3 pr-8 text-sm shadow-sm transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-afit-navy/15 focus:border-afit-navy',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={14}
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
    />
  </div>
));
Select.displayName = 'Select';

export { Select };
