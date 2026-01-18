import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  tablet?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, tablet, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none text-gray-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        tablet && 'text-xl',
        className
      )}
      {...props}
    />
  )
);
Label.displayName = 'Label';

export { Label };
