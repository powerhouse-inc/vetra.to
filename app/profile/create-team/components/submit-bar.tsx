'use client'
import { ChevronLeft, ChevronRight, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'

export function SubmitBar({
  onBack,
  onNext,
  canBack,
  canNext,
  isLast,
  isSubmitting,
}: {
  onBack: () => void
  onNext: () => void
  canBack: boolean
  canNext: boolean
  isLast: boolean
  isSubmitting: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between border-t pt-6">
      <Button variant="outline" onClick={onBack} disabled={!canBack || isSubmitting}>
        <ChevronLeft className="mr-1 size-4" />
        Back
      </Button>
      <Button onClick={onNext} disabled={!canNext || isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Creating…
          </>
        ) : isLast ? (
          <>
            <Sparkles className="mr-2 size-4" />
            Create team
          </>
        ) : (
          <>
            Next
            <ChevronRight className="ml-1 size-4" />
          </>
        )}
      </Button>
    </div>
  )
}
