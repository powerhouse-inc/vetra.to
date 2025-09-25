import { cn } from '../../lib/utils'

function StripedCard({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card"
      className={cn(
        'bg-card text-card-foreground flex flex-col overflow-hidden rounded-xl shadow-sm',
        className,
      )}
      {...props}
    />
  )
}

function StripedCardHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-header"
      className={cn('bg-accent @container/card-header grid grid-rows-1 items-start p-2', className)}
      {...props}
    />
  )
}

function StripedCardTitle({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-title"
      className={cn('text-accent-foreground self-center leading-6 font-semibold', className)}
      {...props}
    />
  )
}

function StripedCardAction({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        'col-start-2 row-span-2 row-start-1 self-center self-start justify-self-end',
        className,
      )}
      {...props}
    />
  )
}

function StripedCardContent({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="card-content" className={cn('p-2', className)} {...props} />
}

export { StripedCard, StripedCardHeader, StripedCardContent, StripedCardTitle, StripedCardAction }
