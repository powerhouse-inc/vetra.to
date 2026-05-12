'use client'

import { RefreshCw } from 'lucide-react'

import { DatabaseSchemaTree } from '@/modules/cloud/components/database-schema-tree'
import { useDatabaseSchema } from '@/modules/cloud/hooks/use-database-schema'
import { Button } from '@/modules/shared/components/ui/button'

type Props = {
  tenantId: string | null
  /**
   * Owner-only gating. The Explorer tab is hidden when canEdit is false, but
   * we accept the prop for symmetry with DatabaseBackupsTab and as a
   * defence-in-depth guard against accidental rendering for non-owners.
   */
  canEdit: boolean
}

export function DatabaseExplorerTab({ tenantId, canEdit }: Props) {
  const { schema, isLoading, error, refresh } = useDatabaseSchema(canEdit ? tenantId : null)

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-muted-foreground text-xs">
          {schema
            ? `${schema.schemas.length} schema${schema.schemas.length === 1 ? '' : 's'}`
            : 'Loading…'}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refresh()}
          disabled={isLoading}
          className="gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </Button>
      </div>

      {error && (
        <div className="text-destructive bg-destructive/10 rounded-md p-3 text-sm">{error}</div>
      )}

      <DatabaseSchemaTree schema={schema} isLoading={isLoading} />
    </div>
  )
}
