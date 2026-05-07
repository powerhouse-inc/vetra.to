/** Format a CPU value (in cores) using k8s milli-core convention below 1 core. */
export function formatCpu(cores: number): string {
  if (cores < 1) return `${Math.round(cores * 1000)}m`
  if (Number.isInteger(cores)) return `${cores} core${cores === 1 ? '' : 's'}`
  return `${cores.toFixed(2)} cores`
}

/** Format a memory value (in bytes) with binary divisor and decimal labels (MB/GB). */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
