import { cva, type VariantProps } from 'class-variance-authority';

export const segmentedVariants = cva(
  'inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg border border-gray-300',
  {
    variants: {
      zSize: {
        sm: 'p-0.5 text-xs h-8',
        default: 'p-1 text-sm h-10',
        lg: 'p-1.5 text-base h-12',
      },
    },
    defaultVariants: {
      zSize: 'default',
    },
  }
);

export type ZardSegmentedVariants = VariantProps<typeof segmentedVariants>;

