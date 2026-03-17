import Link from 'next/link'

import { Button } from '@/modules/shared/components/ui/button'

export function Hero() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20 text-center">
      <span className="bg-primary-30 text-primary mb-6 inline-block rounded-full px-4 py-1.5 text-sm font-medium">
        Local-first. Built to Scale.
      </span>

      <h1 className="text-foreground mx-auto max-w-3xl text-[clamp(40px,5vw,64px)] leading-[1.1] font-bold tracking-tight">
        Local first. Built to scale.
      </h1>

      <p className="text-foreground-70 mx-auto mt-6 max-w-2xl text-lg leading-relaxed">
        Vetra helps you build any type of web application, ERP, CMS, or SaaS Backend on a reactive
        document architecture. Define workflows once, deploy them globally, and co-own the software
        you create.
      </p>

      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/cloud">Get Started</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="https://academy.vetra.io/">Explore Academy</Link>
        </Button>
      </div>
    </section>
  )
}
