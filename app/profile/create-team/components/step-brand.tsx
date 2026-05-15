'use client'
import { Avatar, AvatarFallback, AvatarImage } from '@/modules/shared/components/ui/avatar'

function initials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '??'
}

export function StepBrand({
  name,
  description,
  profileLogo,
  onChange,
}: {
  name: string
  description: string
  profileLogo: string
  onChange: (patch: { description?: string; profileLogo?: string }) => void
}) {
  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="team-description" className="text-sm font-medium">
            Description
          </label>
          <span className="text-muted-foreground text-xs">{description.length} / 280</span>
        </div>
        <textarea
          id="team-description"
          className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
          rows={4}
          maxLength={280}
          placeholder="What does your team build?"
          value={description}
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
      <div>
        <label htmlFor="team-logo" className="mb-1 block text-sm font-medium">
          Logo URL
        </label>
        <div className="flex items-start gap-3">
          <Avatar className="size-12">
            {profileLogo && <AvatarImage src={profileLogo} alt={name || 'Logo preview'} />}
            <AvatarFallback className="bg-muted text-sm font-bold">{initials(name)}</AvatarFallback>
          </Avatar>
          <input
            id="team-logo"
            className="bg-background focus:ring-primary flex-1 rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
            placeholder="https://example.com/logo.png"
            value={profileLogo}
            onChange={(e) => onChange({ profileLogo: e.target.value })}
          />
        </div>
        <p className="text-muted-foreground mt-1 text-xs">
          Optional. Direct link to a square image (PNG, SVG, JPG). You can edit later.
        </p>
      </div>
    </div>
  )
}
