import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/modules/shared/components/ui/button'

export function CloudCta() {
  return (
    <section className="mx-auto max-w-screen-xl px-6 py-20">
      <div className="flex flex-col items-center gap-10 md:flex-row">
        <div className="flex-1">
          <h2 className="text-foreground mb-4 text-3xl font-bold">Launch with Vetra Cloud</h2>
          <p className="text-foreground-70 mb-1 max-w-lg leading-relaxed">
            Vetra Cloud is a real-time sync and storage infrastructure that scales up your workflows
            up to millions of users.
          </p>
          <p className="text-foreground mb-6 font-semibold">
            Documents as code, code as infrastructure.
          </p>
          <Button asChild size="lg">
            <Link href="/cloud">Explore Vetra Cloud</Link>
          </Button>
        </div>
        <div className="flex-1">
          <Image
            src="/images/home/cloud-preview.svg"
            alt="Vetra Cloud"
            width={600}
            height={400}
            className="h-auto w-full"
          />
        </div>
      </div>
    </section>
  )
}
