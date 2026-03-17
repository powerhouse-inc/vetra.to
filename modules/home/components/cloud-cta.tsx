import Link from 'next/link'

import { Button } from '@/modules/shared/components/ui/button'

export function CloudCta() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
      <div className="text-center">
        <h2 className="text-foreground mb-4 text-3xl font-bold">Launch with Vetra Cloud</h2>
        <p className="text-foreground-70 mx-auto mb-4 max-w-2xl leading-relaxed">
          Vetra Cloud is a real-time sync and storage infrastructure that scales up your workflows
          up to millions of users.
        </p>
        <p className="text-foreground mb-8 font-semibold">
          Documents as code, code as infrastructure.
        </p>
        <Button asChild size="lg">
          <Link href="/cloud">Explore Open Cloud</Link>
        </Button>
      </div>
    </section>
  )
}
