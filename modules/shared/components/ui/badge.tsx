import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/shared/lib/utils'

/**
 * Badge — small status / tag label.
 *
 * Variant chooses the colour role:
 * - `default`     — primary brand fill (use sparingly; for "highlighted" tags).
 * - `secondary`   — soft fill, low emphasis (default tag style in dense rows).
 * - `outline`     — bordered, transparent fill (neutral metadata).
 * - `destructive` — solid red (errors / required-but-missing / etc.).
 *
 * Size chooses the typography:
 * - `default` — `text-xs` (~12px), comfortable for prose.
 * - `xs`      — `text-[10px]`, for dense rows / tables. Replaces the
 *               ad-hoc `className="text-[9-11px]"` overrides previously
 *               scattered across the codebase.
 */
const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline: 'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
      },
      size: {
        default: 'px-2 py-0.5 text-xs',
        xs: 'px-1.5 py-0 text-[10px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Badge({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
