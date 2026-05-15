'use client'
import { AlertCircle, RotateCw } from 'lucide-react'
import { Button } from '@/modules/shared/components/ui/button'
import { Card, CardContent } from '@/modules/shared/components/ui/card'

export function TabErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex items-center gap-4 p-6">
        <AlertCircle className="text-destructive size-5 shrink-0" />
        <div className="flex-1">
          <div className="text-sm font-medium">{message}</div>
        </div>
        <Button onClick={onRetry} variant="outline" size="sm">
          <RotateCw className="mr-1.5 size-3.5" />
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}
