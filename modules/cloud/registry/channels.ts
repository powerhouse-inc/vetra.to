const CHANNEL_RE = /^v?(\d+)\.(\d+)\.(\d+)-([a-zA-Z]+)\.(\d+)$/
const STABLE_RE = /^v?(\d+)\.(\d+)\.(\d+)$/

type Parsed = {
  tag: string
  major: number
  minor: number
  patch: number
  bump: number
}

function parseTag(tag: string): { channel: string; parsed: Parsed } | null {
  const channelMatch = tag.match(CHANNEL_RE)
  if (channelMatch) {
    const [, maj, min, pat, channel, bump] = channelMatch
    return {
      channel: channel.toLowerCase(),
      parsed: {
        tag,
        major: Number(maj),
        minor: Number(min),
        patch: Number(pat),
        bump: Number(bump),
      },
    }
  }
  const stableMatch = tag.match(STABLE_RE)
  if (stableMatch) {
    const [, maj, min, pat] = stableMatch
    return {
      channel: 'latest',
      parsed: {
        tag,
        major: Number(maj),
        minor: Number(min),
        patch: Number(pat),
        bump: Number.POSITIVE_INFINITY,
      },
    }
  }
  return null
}

function isNewer(a: Parsed, b: Parsed): boolean {
  if (a.major !== b.major) return a.major > b.major
  if (a.minor !== b.minor) return a.minor > b.minor
  if (a.patch !== b.patch) return a.patch > b.patch
  return a.bump > b.bump
}

export function computeDistTags(tags: string[]): Record<string, string> {
  const buckets: Record<string, Parsed> = {}
  for (const tag of tags) {
    const result = parseTag(tag)
    if (!result) continue
    const current = buckets[result.channel]
    if (!current || isNewer(result.parsed, current)) {
      buckets[result.channel] = result.parsed
    }
  }
  return Object.fromEntries(Object.entries(buckets).map(([k, v]) => [k, v.tag]))
}
