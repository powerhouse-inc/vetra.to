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

export const metadata = {
  title: 'Vetra — Local first. Built to scale.',
  description:
    'Build any type of web application, ERP, CMS, or SaaS Backend on a reactive document architecture.',
}

export default function HomePage() {
  return (
    <div className="pt-16">
      <Hero />
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
