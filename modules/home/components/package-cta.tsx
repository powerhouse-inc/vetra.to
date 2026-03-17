import Image from 'next/image'
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
        <div className="mx-auto mb-8 max-w-5xl">
          <Image
            src="/images/home/package-library.png"
            alt="Vetra Package Library"
            width={1596}
            height={829}
            className="h-auto w-full"
          />
        </div>
        <Button asChild size="lg">
          <Link href="/packages">Browse Packages</Link>
        </Button>
      </div>
    </section>
  )
}
