import Link from 'next/link'
import { IsoGrid } from '@/modules/shared/components/ui/iso-grid'

export function CloudLandingHero() {
  return (
    <section className="relative px-6 py-20 text-center md:py-28 overflow-hidden">
      <IsoGrid />
      <div className="relative z-10 mx-auto max-w-[var(--container-width)]">
        <p className="text-primary mb-4 text-sm font-semibold">The Open Cloud, on your terms.</p>
        <h1 className="mx-auto mb-4 max-w-2xl text-[clamp(28px,4vw,48px)] leading-[1.1] font-bold">
          Independent infrastructure{' '}
          <span className="text-primary">for independent organizations</span>
        </h1>
        <p className="text-foreground-70 mx-auto mb-8 max-w-xl text-base leading-relaxed">
          Combine the scalability and convenience of centralized cloud providers with the resilience
          of on-premise hosting.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/cloud"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-8 py-3 text-sm font-semibold transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="#features"
            className="bg-accent text-foreground hover:bg-accent/80 rounded-lg px-8 py-3 text-sm font-semibold transition-colors"
          >
            Learn More
          </Link>
        </div>
      </div>
    </section>
  )
}
