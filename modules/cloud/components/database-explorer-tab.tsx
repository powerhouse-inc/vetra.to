'use client'

import { sql } from '@codemirror/lang-sql'
import CodeMirror from '@uiw/react-codemirror'
import { Play, RefreshCw } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'

import { AsyncButton } from '@/modules/cloud/components/async-button'
import { DatabaseSchemaTree } from '@/modules/cloud/components/database-schema-tree'
import { useDatabaseQuery } from '@/modules/cloud/hooks/use-database-query'
import { useDatabaseSchema } from '@/modules/cloud/hooks/use-database-schema'
import type { DatabaseQueryResult } from '@/modules/cloud/types'
import { Button } from '@/modules/shared/components/ui/button'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/modules/shared/components/ui/resizable'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/shared/components/ui/select'

type Props = {
  tenantId: string | null
  /**
   * Owner-only gating. The Explorer tab is hidden when canEdit is false, but
   * we accept the prop for symmetry with DatabaseBackupsTab and as a
   * defence-in-depth guard against accidental rendering for non-owners.
   */
  canEdit: boolean
}

const LIMIT_OPTIONS = [100, 1000, 5000, 10000] as const

const ERROR_COPY: Record<string, string> = {
  QUERY_BLOCKED: "Read-only mode: that statement isn't allowed.",
  QUERY_TIMEOUT: 'Query exceeded the 5-second timeout.',
  QUERY_EMPTY: 'Enter a SQL statement.',
  EXPLORER_NOT_CONFIGURED: "Database explorer isn't available for this environment.",
}

function friendlyError(raw: string | null): string | null {
  if (!raw) return null
  for (const code of Object.keys(ERROR_COPY)) {
    if (raw.includes(code)) return ERROR_COPY[code]
  }
  return raw
}

export function DatabaseExplorerTab({ tenantId, canEdit }: Props) {
  const effectiveTenantId = canEdit ? tenantId : null
  const {
    schema,
    isLoading: schemaLoading,
    error: schemaError,
    refresh,
  } = useDatabaseSchema(effectiveTenantId)
  const { result, isRunning, error: queryError, run } = useDatabaseQuery(effectiveTenantId)

  const [editorSql, setEditorSql] = useState('')
  const [limit, setLimit] = useState<number>(1000)

  const handleRun = useCallback(async () => {
    const trimmed = editorSql.trim()
    if (!trimmed) return
    await run(trimmed, limit)
  }, [editorSql, limit, run])

  const handleEditorKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault()
        void handleRun()
      }
    },
    [handleRun],
  )

  const handleTableClick = useCallback((schemaName: string, tableName: string) => {
    setEditorSql(`SELECT * FROM "${schemaName}"."${tableName}" LIMIT 100`)
  }, [])

  const statementCount = useMemo(
    () => editorSql.split(';').filter((s) => s.trim().length > 0).length,
    [editorSql],
  )
  const showMultiStatementNotice = statementCount > 1

  return (
    <div className="flex h-[560px] flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          {schema
            ? `${schema.schemas.length} schema${schema.schemas.length === 1 ? '' : 's'}`
            : schemaLoading
              ? 'Loading…'
              : 'No schema'}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={schemaLoading}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {schemaError && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">
          {schemaError}
        </div>
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-md border">
        <ResizablePanel defaultSize={30} minSize={20} className="overflow-auto p-2">
          <DatabaseSchemaTree
            schema={schema}
            isLoading={schemaLoading}
            onTableClick={handleTableClick}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={45} minSize={20} className="flex flex-col">
              <div className="flex items-center gap-2 border-b px-2 py-1.5">
                <AsyncButton
                  size="sm"
                  onClickAsync={handleRun}
                  pendingLabel="Running…"
                  disabled={!editorSql.trim() || !effectiveTenantId}
                  className="gap-1.5"
                >
                  <Play className="h-3.5 w-3.5" /> Run
                </AsyncButton>
                <Select value={String(limit)} onValueChange={(v) => setLimit(Number(v))}>
                  <SelectTrigger size="sm" className="h-8 w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LIMIT_OPTIONS.map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n.toLocaleString()} rows
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-muted-foreground ml-auto text-[11px]">
                  Cmd/Ctrl+Enter to run
                </span>
              </div>
              <div className="min-h-0 flex-1 overflow-auto" onKeyDown={handleEditorKeyDown}>
                <CodeMirror
                  value={editorSql}
                  onChange={setEditorSql}
                  extensions={[sql()]}
                  basicSetup={{ lineNumbers: true, foldGutter: false }}
                  placeholder="-- SELECT 1"
                  height="100%"
                  className="h-full text-xs"
                />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={55} minSize={20} className="overflow-auto">
              {showMultiStatementNotice && (
                <div className="text-muted-foreground border-b px-3 py-1.5 text-[11px]">
                  Only the first statement runs.
                </div>
              )}
              <ResultPanel
                result={result}
                isRunning={isRunning}
                error={friendlyError(queryError)}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function ResultPanel({
  result,
  isRunning,
  error,
}: {
  result: DatabaseQueryResult | null
  isRunning: boolean
  error: string | null
}) {
  if (error) {
    return (
      <div className="p-3">
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">{error}</div>
      </div>
    )
  }

  if (isRunning && !result) {
    return <div className="text-muted-foreground p-6 text-center text-xs">Running…</div>
  }

  if (!result) {
    return (
      <div className="text-muted-foreground p-6 text-center text-xs">
        Run a query to see results.
      </div>
    )
  }

  if (result.columns.length === 0) {
    return (
      <div className="text-muted-foreground p-6 text-center text-xs">
        Query returned no columns.
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 sticky top-0">
            <tr>
              {result.columns.map((c) => (
                <th
                  key={c}
                  className="border-b px-2 py-1.5 text-left font-medium whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, i) => (
              <tr key={i} className="hover:bg-muted/30">
                {row.map((cell, j) => (
                  <td key={j} className="border-b px-2 py-1 align-top">
                    {cell === null ? (
                      <span className="text-muted-foreground italic">null</span>
                    ) : (
                      <span className="font-mono whitespace-pre-wrap">{cell}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bg-muted/40 text-muted-foreground flex items-center justify-between border-t px-3 py-1.5 text-[11px]">
        <span>
          {result.rowCount} row{result.rowCount === 1 ? '' : 's'} · {result.executionMs} ms
        </span>
        {result.truncatedAt !== null && (
          <span className="italic">Truncated at {result.truncatedAt} rows</span>
        )}
      </div>
    </div>
  )
}
