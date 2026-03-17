import Link from 'next/link'

import { Button } from '@/modules/shared/components/ui/button'

export function PackageCta() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
      <div className="bg-accent rounded-xl p-10 text-center">
        <h2 className="text-foreground mb-4 text-2xl font-bold">
          Explore the Vetra Package Library
        </h2>
        <p className="text-foreground-70 mx-auto mb-8 max-w-lg">
          Browse community-built packages, document models, and extensions ready to use in your
          projects.
        </p>
        <Button asChild size="lg">
          <Link href="/packages">Browse Packages</Link>
        </Button>
      </div>
    </section>
  )
}
