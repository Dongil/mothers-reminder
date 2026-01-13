import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-gray-900 text-white hover:bg-gray-800 focus-visible:ring-gray-900',
        primary:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
        outline:
          'border-2 border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost:
          'hover:bg-gray-100 focus-visible:ring-gray-500',
        link:
          'text-blue-600 underline-offset-4 hover:underline focus-visible:ring-blue-600',
        // 태블릿용 큰 버튼
        tablet:
          'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600 text-2xl font-bold shadow-lg',
        'tablet-outline':
          'border-3 border-blue-600 text-blue-600 bg-white hover:bg-blue-50 focus-visible:ring-blue-600 text-2xl font-bold',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-12 px-6 text-lg',
        xl: 'h-14 px-8 text-xl',
        // 태블릿용 큰 사이즈
        tablet: 'h-16 px-8 min-w-[200px]',
        'tablet-lg': 'h-20 px-10 min-w-[240px]',
        icon: 'h-11 w-11',
        'icon-lg': 'h-14 w-14',
        'icon-tablet': 'h-16 w-16',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
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
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
