import * as React from 'react'

import { cn } from '@/shared/lib/utils'

function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl shadow-sm dark:border dark:border-gray-800',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 p-6 has-data-[slot=card-action]:grid-cols-[1fr_auto]',
        className,
      )}
      {...props}
    />
  )
}

function CardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('leading-none font-semibold', className)}
      {...props}
    />
  )
}

function CardDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-description"
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function CardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn('col-start-2 row-span-2 row-start-1 self-start justify-self-end', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-6', className)} {...props} />
}

function CardFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div data-slot="card-footer" className={cn('flex items-center p-6', className)} {...props} />
  )
}

/**
 * "Hero" variant of Card for prominent moments — env-detail header,
 * primary status panel, big landing-page-style call-outs. Opt-in;
 * existing Card consumers are unchanged.
 *
 *  - `glass`: semi-transparent + backdrop blur, sits over the ambient
 *    background layer for a frosted-glass surface.
 *  - `accentTop`: a hairline brand-color stripe at the top edge.
 */
function HeroCard({
  className,
  glass = false,
  accentTop = true,
  ...props
}: React.ComponentProps<'div'> & { glass?: boolean; accentTop?: boolean }) {
  return (
    <div
      data-slot="hero-card"
      className={cn(
        'relative flex flex-col overflow-hidden rounded-xl shadow-sm dark:border dark:border-gray-800',
        glass ? 'bg-card/70 backdrop-blur-xl' : 'bg-card text-card-foreground',
        accentTop &&
          'before:via-primary before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:opacity-50',
        className,
      )}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  HeroCard,
}
