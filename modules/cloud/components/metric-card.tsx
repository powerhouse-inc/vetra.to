import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import type { MetricSeries } from '@/modules/cloud/types'
import { Sparkline } from './sparkline'

type MetricCardProps = {
  title: string
  series: MetricSeries[]
  formatValue: (value: number) => string
  unit?: string
  isLoading?: boolean
}

export function MetricCard({ title, series, formatValue, unit, isLoading }: MetricCardProps) {
  const firstSeries = series[0]
  const datapoints = firstSeries?.datapoints ?? []
  const latestDatapoint = datapoints.length > 0 ? datapoints[datapoints.length - 1] : null
  const hasData = series.some((s) => s.datapoints.length > 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {isLoading ? (
          <>
            <div className="bg-muted h-8 w-24 animate-pulse rounded" />
            <div className="bg-muted h-[100px] w-full animate-pulse rounded" />
          </>
        ) : !hasData ? (
          <>
            <p className="text-muted-foreground text-2xl font-bold">—</p>
            <div className="bg-muted/30 flex h-[100px] items-center justify-center rounded">
              <p className="text-muted-foreground text-sm">No data</p>
            </div>
          </>
        ) : (
          <>
            <p className="text-2xl font-bold">
              {latestDatapoint !== null ? formatValue(latestDatapoint.value) : '—'}
              {unit && (
                <span className="text-muted-foreground ml-1 text-sm font-normal">{unit}</span>
              )}
            </p>
            <div className="w-full">
              <Sparkline series={series} width={300} height={100} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
