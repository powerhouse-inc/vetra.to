type Props = {
  clusterName: string
}

export function DatabaseOverviewTab({ clusterName }: Props) {
  return (
    <div className="space-y-3 text-sm">
      <Field label="Cluster" value={clusterName} mono />
      <Field label="Engine" value="PostgreSQL 16" />
      <Field label="Pooler" value={`${clusterName}-pooler`} mono />
      <p className="text-muted-foreground border-border/40 mt-4 border-t pt-4 text-xs">
        Detailed metrics, replication lag and connection counts live in the cluster-wide Grafana
        dashboards. To work with this database off-platform, switch to the Backups tab and download
        a recent dump.
      </p>
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className={mono ? 'truncate text-right font-mono text-xs' : 'truncate text-right'}>
        {value}
      </span>
    </div>
  )
}
