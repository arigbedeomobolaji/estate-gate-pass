import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    className={cn(
      'h-11 w-full rounded-xl border border-input bg-white px-3.5 text-sm font-medium shadow-sm',
      'transition-all duration-150',
      'placeholder:text-muted-foreground placeholder:font-normal',
      'focus:outline-none focus:border-afit-navy/70 focus:ring-[3px] focus:ring-afit-navy/10',
      'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-muted',
      className
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export { Input };
