import type { LogEntry } from '@/modules/cloud/types'

function formatLogTimestamp(ts: number): string {
  const date = new Date(ts * 1000)
  return date.toISOString().slice(11, 23) // HH:mm:ss.SSS
}

type LogViewerProps = {
  logs: LogEntry[]
  isLoading?: boolean
}

export function LogViewer({ logs, isLoading }: LogViewerProps) {
  return (
    <div className="max-h-[500px] overflow-auto rounded-lg bg-gray-950 p-4 font-mono text-xs text-gray-100">
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <div className="h-3 w-20 rounded bg-gray-800" />
              <div
                className="h-3 rounded bg-gray-800"
                style={{ width: `${40 + ((i * 17) % 40)}%` }}
              />
            </div>
          ))}
        </div>
      ) : logs.length === 0 ? (
        <p className="py-8 text-center text-gray-500">No logs in this time range</p>
      ) : (
        <div className="space-y-0.5">
          {[...logs].reverse().map((entry, i) => (
            <div key={i} className="flex gap-2 leading-5">
              <span className="shrink-0 text-gray-500 select-none">
                {formatLogTimestamp(entry.timestamp)}
              </span>
              <span className="break-all whitespace-pre-wrap">{entry.line}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
