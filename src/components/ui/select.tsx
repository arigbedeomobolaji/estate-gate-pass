import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      className={cn(
        'h-11 w-full appearance-none rounded-xl border border-input bg-white pl-3.5 pr-9 text-sm font-medium shadow-sm',
        'transition-all duration-150',
        'focus:outline-none focus:border-afit-navy/70 focus:ring-[3px] focus:ring-afit-navy/10',
        'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
        className
      )}
      {...props}
    >
      {children}
    </select>
    <ChevronDown
      size={15}
      className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
    />
  </div>
));
Select.displayName = 'Select';

export { Select };
