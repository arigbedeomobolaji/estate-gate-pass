import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none',
  {
    variants: {
      variant: {
        navy: 'afit-gradient-hero text-white shadow-sm hover:opacity-90 active:scale-[0.98]',
        default: 'bg-foreground text-background shadow-sm hover:bg-foreground/90 active:scale-[0.98]',
        outline: 'border border-input bg-background shadow-sm hover:bg-muted active:scale-[0.98]',
        ghost: 'hover:bg-muted active:scale-[0.98]',
        destructive: 'bg-red-50 text-red-600 border border-red-200 shadow-sm hover:bg-red-100 active:scale-[0.98]',
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm hover:bg-emerald-100 active:scale-[0.98]',
        link: 'text-afit-navy underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4',
        xs: 'h-6 px-2 text-xs rounded-md gap-1',
        sm: 'h-8 px-3',
        lg: 'h-10 px-6 text-base',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
        'icon-lg': 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'outline', size: 'default' },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
