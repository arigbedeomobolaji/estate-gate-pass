import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'h-9 w-full rounded-lg border border-input bg-white px-3 text-sm shadow-sm transition-colors',
      'placeholder:text-muted-foreground',
      'focus:outline-none focus:ring-2 focus:ring-afit-navy/15 focus:border-afit-navy',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
