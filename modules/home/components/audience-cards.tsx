import Image from 'next/image'

import { Card, CardContent, CardHeader, CardTitle } from '@/modules/shared/components/ui/card'

const audiences = [
  {
    title: 'Builders & Developers',
    description:
      'Want control without overhead? Use Vetra to launch services, build extensions, and own your deployment.',
    image: '/images/home/audience-builders.png',
  },
  {
    title: 'System Integrators',
    description:
      'Deploy Vetra stacks for clients, offer managed services, and customize solutions. Get paid for uptime and support.',
    image: '/images/home/audience-integrators.jpg',
  },
  {
    title: 'Data & AI Teams',
    description:
      'Subscribe to events across workflows and contributor actions. Train AI on structured, cross-org data streams.',
    image: '/images/home/audience-data-ai.svg',
  },
]

export function AudienceCards() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
      <h2 className="text-foreground mb-4 text-center text-3xl font-bold">
        Who it&apos;s built for
      </h2>
      <p className="text-foreground-70 mx-auto mb-12 max-w-lg text-center">
        Vetra is designed for teams that need full control of their coordination infrastructure.
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        {audiences.map((audience) => (
          <Card key={audience.title}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Image
                  src={audience.image}
                  alt={audience.title}
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
                <CardTitle>{audience.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-foreground-70 text-sm leading-relaxed">{audience.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
