export function getTenantId(subdomain: string, documentId: string): string {
  const shortId = documentId.replace(/-/g, '').slice(0, 8)
  return `${subdomain}-${shortId}`
}
