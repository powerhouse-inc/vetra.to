'use client'
import { Github, Globe } from 'lucide-react'
import XLogo from '@/modules/shared/components/icons/x-logo'
import { isValidUrl } from '@/modules/profile/lib/validations'

type Socials = {
  profileSocialsX: string
  profileSocialsGithub: string
  profileSocialsWebsite: string
}

const FIELDS: {
  key: keyof Socials
  label: string
  placeholder: string
  Icon: React.ComponentType<{ className?: string }>
}[] = [
  {
    key: 'profileSocialsX',
    label: 'X (Twitter)',
    placeholder: 'https://x.com/your-team',
    Icon: ({ className }) => <XLogo className={className} />,
  },
  {
    key: 'profileSocialsGithub',
    label: 'GitHub',
    placeholder: 'https://github.com/your-team',
    Icon: Github,
  },
  {
    key: 'profileSocialsWebsite',
    label: 'Website',
    placeholder: 'https://your-team.com',
    Icon: Globe,
  },
]

export function StepSocials({
  values,
  onChange,
}: {
  values: Socials
  onChange: (patch: Partial<Socials>) => void
}) {
  return (
    <div className="space-y-5">
      {FIELDS.map(({ key, label, placeholder, Icon }) => {
        const v = values[key]
        const invalid = !isValidUrl(v)
        return (
          <div key={key}>
            <label htmlFor={key} className="mb-1 flex items-center gap-1.5 text-sm font-medium">
              <Icon className="size-3.5" />
              {label}
            </label>
            <input
              id={key}
              type="url"
              className="bg-background focus:ring-primary w-full rounded-md border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              placeholder={placeholder}
              value={v}
              onChange={(e) => onChange({ [key]: e.target.value } as Partial<Socials>)}
            />
            {invalid ? (
              <p className="text-destructive mt-1 text-xs">Must be a valid URL.</p>
            ) : (
              <p className="text-muted-foreground mt-1 text-xs">Optional.</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
