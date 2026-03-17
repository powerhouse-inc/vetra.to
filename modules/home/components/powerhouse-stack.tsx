import Link from 'next/link'

import { Button } from '@/modules/shared/components/ui/button'

export function PowerhouseStack() {
  return (
    <section className="border-border border-y">
      <div className="mx-auto max-w-[var(--container-width)] px-6 py-20 text-center">
        <h2 className="text-foreground mb-4 text-3xl font-bold">Part of the Powerhouse Stack</h2>
        <p className="text-foreground-70 mx-auto mb-4 max-w-2xl leading-relaxed">
          Tools that make distributed work simple and private.
        </p>
        <p className="text-foreground-70 mx-auto mb-4 max-w-2xl leading-relaxed">
          Run work the same way every time — clear forms, shared files, private sync, and ready-made
          templates.
        </p>
        <p className="text-foreground mx-auto mb-8 max-w-2xl font-medium">
          Start your organization. Hire your operator. Find your builder.
        </p>
        <Button asChild variant="outline" size="lg">
          <Link href="https://powerhouse.inc">Visit Powerhouse</Link>
        </Button>
      </div>
    </section>
  )
}
