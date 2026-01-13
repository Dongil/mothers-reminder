import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-gray-900 text-white',
        secondary: 'border-transparent bg-gray-100 text-gray-900',
        outline: 'border-gray-300 text-gray-700',
        // 중요도별 배지
        normal: 'border-transparent bg-gray-100 text-gray-700',
        important: 'border-transparent bg-yellow-100 text-yellow-800',
        urgent: 'border-transparent bg-red-100 text-red-800',
        // D-day 배지
        dday: 'border-transparent bg-blue-100 text-blue-800',
      },
      size: {
        default: 'text-sm px-3 py-1',
        lg: 'text-base px-4 py-1.5',
        tablet: 'text-lg px-5 py-2',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
