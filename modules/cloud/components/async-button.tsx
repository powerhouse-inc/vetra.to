'use client'

import { Loader2 } from 'lucide-react'
import * as React from 'react'

import { useAsyncAction } from '@/modules/cloud/hooks/use-async-action'
import { Button } from '@/modules/shared/components/ui/button'

type BaseButtonProps = React.ComponentProps<typeof Button>

type Props = Omit<BaseButtonProps, 'onClick'> & {
  /**
   * Async click handler. While the returned promise is in flight, the button
   * is disabled and shows a spinner + (optionally) `pendingLabel` instead of
   * its children.
   */
  onClickAsync: (event: React.MouseEvent<HTMLButtonElement>) => Promise<unknown>
  /** Label shown next to the spinner while pending. Defaults to children. */
  pendingLabel?: React.ReactNode
}

/**
 * Drop-in replacement for `<Button>` that knows how to handle an async
 * onClick. Removes the ad-hoc `isLoading` state littered across every
 * mutation site, and keeps the button visually consistent with the mutation
 * status — no more "click and pray nothing happened".
 */
export function AsyncButton({ onClickAsync, pendingLabel, disabled, children, ...rest }: Props) {
  const { run, isPending } = useAsyncAction(onClickAsync)

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    void run(event).catch(() => {
      // Swallow — caller already had a chance to react via onClickAsync's
      // rejection; we just need to keep `run` from logging an unhandled
      // rejection here.
    })
  }

  return (
    <Button disabled={disabled || isPending} onClick={handleClick} {...rest}>
      {isPending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {pendingLabel ?? children}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
