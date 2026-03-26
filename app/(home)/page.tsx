import { AudienceCards } from '@/modules/home/components/audience-cards'
import { CloudCta } from '@/modules/home/components/cloud-cta'
import { FaqSection } from '@/modules/home/components/faq-section'
import { FeatureShowcase } from '@/modules/home/components/feature-showcase'
import { FeaturesTabs } from '@/modules/home/components/features-tabs'
import { Hero } from '@/modules/home/components/hero'
import { PackageCta } from '@/modules/home/components/package-cta'
import { PowerhouseStack } from '@/modules/home/components/powerhouse-stack'
import { SpecToScale } from '@/modules/home/components/spec-to-scale'
import { TrustBar } from '@/modules/home/components/trust-bar'
import { WaitlistSignup } from '@/modules/home/components/waitlist-signup'
import { GridBackground } from '@/modules/shared/components/ui/grid-background'

export const metadata = {
  title: 'Vetra — Local first. Built to scale.',
  description:
    'Build any type of web application, ERP, CMS, or SaaS Backend on a reactive document architecture.',
}

export default function HomePage() {
  return (
    <div className="pt-16 relative">
      {/* Grid background for hero section */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="h-[600px] relative">
          {/* Grid without fade */}
          <GridBackground
            squareSize={30}
            strokeWidth={2}
            strokeColor="#04c161"
            topFadeDistance={0}
            topFadeIntensity={0}
            bottomFadeDistance={0}
            bottomFadeIntensity={0}
            leftFadeDistance={0}
            leftFadeIntensity={0}
            rightFadeDistance={0}
            rightFadeIntensity={0}
            className="absolute inset-0 opacity-15"
          />
          {/* CSS-based fade overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent via-transparent to-background opacity-100"></div>
        </div>
      </div>
      <div className="relative z-10">
        <Hero />
      </div>
      <TrustBar />
      <FeaturesTabs />
      <SpecToScale />
      <AudienceCards />
      <FeatureShowcase />
      <PackageCta />
      <CloudCta />
      <PowerhouseStack />
      <WaitlistSignup />
      <FaqSection />
    </div>
  )
}
