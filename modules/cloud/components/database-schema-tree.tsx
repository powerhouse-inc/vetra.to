'use client'

import { ChevronRight, Database, KeyRound, Table as TableIcon } from 'lucide-react'
import { useState } from 'react'

import type { DatabaseSchema, DatabaseSchemaInfo, DatabaseTableInfo } from '@/modules/cloud/types'
import { Badge } from '@/modules/shared/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/modules/shared/components/ui/collapsible'
import { cn } from '@/shared/lib/utils'

type Props = {
  schema: DatabaseSchema | null
  isLoading: boolean
  /**
   * Called when the user clicks a table row (not the chevron — that just
   * toggles the column list). Slice 2 wires this to populate the editor.
   */
  onTableClick?: (schemaName: string, tableName: string) => void
}

export function DatabaseSchemaTree({ schema, isLoading, onTableClick }: Props) {
  if (isLoading && !schema) {
    return <div className="text-muted-foreground py-6 text-center text-xs">Loading schema…</div>
  }

  if (!schema || schema.schemas.length === 0) {
    return (
      <div className="text-muted-foreground bg-muted/30 flex flex-col items-center gap-2 rounded-lg border border-dashed p-6 text-center">
        <Database className="h-5 w-5" />
        <p className="text-xs">No schemas to display.</p>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {schema.schemas.map((s) => (
        <SchemaNode key={s.name} schema={s} onTableClick={onTableClick} />
      ))}
    </div>
  )
}

function SchemaNode({
  schema,
  onTableClick,
}: {
  schema: DatabaseSchemaInfo
  onTableClick?: (schemaName: string, tableName: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="hover:bg-muted/40 flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-xs">
        <ChevronRight
          className={cn('h-3 w-3 shrink-0 transition-transform', open && 'rotate-90')}
        />
        <Database className="text-muted-foreground h-3.5 w-3.5 shrink-0" />
        <span className="font-medium">{schema.name}</span>
        <span className="text-muted-foreground ml-1">
          {schema.tables.length} {schema.tables.length === 1 ? 'table' : 'tables'}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="ml-4 space-y-0.5 border-l pl-2">
        {schema.tables.map((t) => (
          <TableNode key={t.name} schemaName={schema.name} table={t} onTableClick={onTableClick} />
        ))}
        {schema.truncated && (
          <div className="text-muted-foreground px-1.5 py-1 text-[11px] italic">
            More tables (truncated)
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function TableNode({
  schemaName,
  table,
  onTableClick,
}: {
  schemaName: string
  table: DatabaseTableInfo
  onTableClick?: (schemaName: string, tableName: string) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="hover:bg-muted/40 group flex items-center gap-1 rounded">
        <CollapsibleTrigger
          aria-label={open ? 'Collapse columns' : 'Expand columns'}
          className="flex h-6 w-6 shrink-0 items-center justify-center"
        >
          <ChevronRight
            className={cn(
              'text-muted-foreground h-3 w-3 transition-transform',
              open && 'rotate-90',
            )}
          />
        </CollapsibleTrigger>
        <button
          type="button"
          onClick={() => onTableClick?.(schemaName, table.name)}
          className="flex flex-1 items-center gap-1.5 py-1 pr-1.5 text-left text-xs"
        >
          <TableIcon className="text-muted-foreground h-3 w-3 shrink-0" />
          <span className="font-mono">{table.name}</span>
          <span className="ml-auto flex items-center gap-1">
            {table.indexes.length > 0 && (
              <Badge size="xs" variant="outline">
                {table.indexes.length} idx
              </Badge>
            )}
          </span>
        </button>
      </div>
      <CollapsibleContent className="ml-6 space-y-0.5 border-l pl-2">
        {table.columns.map((c) => (
          <div
            key={c.name}
            className="flex items-center gap-1.5 px-1.5 py-0.5 text-[11px]"
            title={c.default !== null ? `default: ${c.default}` : undefined}
          >
            {c.isPrimaryKey ? (
              <KeyRound className="text-warning h-2.5 w-2.5 shrink-0" />
            ) : (
              <span className="h-2.5 w-2.5 shrink-0" />
            )}
            <span className="font-medium">{c.name}</span>
            <span className="text-muted-foreground font-mono">{c.type}</span>
            <span
              className={cn(
                'ml-auto inline-block h-1.5 w-1.5 shrink-0 rounded-full',
                c.nullable ? 'bg-muted-foreground/40' : 'bg-foreground/60',
              )}
              title={c.nullable ? 'nullable' : 'NOT NULL'}
            />
          </div>
        ))}
        {table.columns.length === 0 && (
          <div className="text-muted-foreground px-1.5 py-0.5 text-[11px] italic">No columns</div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
