import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'
import type { MetricSeries } from '@/modules/cloud/types'
import { Sparkline } from './sparkline'

const SERIES_COLORS = ['#04c161', '#329dff', '#ffa132', '#ea4335', '#9333ea', '#06b6d4']

type MetricCardProps = {
  title: string
  description?: string
  series: MetricSeries[]
  formatValue: (value: number) => string
  unit?: string
  isLoading?: boolean
}

export function MetricCard({
  title,
  description,
  series,
  formatValue,
  unit,
  isLoading,
}: MetricCardProps) {
  const firstSeries = series[0]
  const datapoints = firstSeries?.datapoints ?? []
  const latestDatapoint = datapoints.length > 0 ? datapoints[datapoints.length - 1] : null
  const hasData = series.some((s) => s.datapoints.length > 0)

  return (
    <Card className="transition-shadow duration-200 hover:shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">{title}</CardTitle>
        {description && <p className="text-muted-foreground/70 text-xs">{description}</p>}
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
              <Sparkline series={series} width={300} height={100} formatValue={formatValue} />
            </div>
            {series.length > 1 && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1">
                {series.map((s, i) => {
                  const latest = s.datapoints[s.datapoints.length - 1]
                  const shortLabel = s.label.replace(/^.*-(?=(connect|switchboard|pg|pooler))/, '')
                  return (
                    <div key={i} className="flex items-center gap-1.5 text-[10px]">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                      />
                      <span
                        className="text-muted-foreground max-w-[120px] truncate"
                        title={s.label}
                      >
                        {shortLabel}
                      </span>
                      {latest && (
                        <span className="text-foreground font-medium">
                          {formatValue(latest.value)}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
