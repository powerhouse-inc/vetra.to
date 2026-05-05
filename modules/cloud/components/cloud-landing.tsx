import { CloudLandingFeatures } from './cloud-landing-features'
import { CloudLandingFAQ } from './cloud-landing-faq'
import { CloudLandingCTA } from './cloud-landing-cta'
import { CloudLandingHero } from './cloud-landing-hero'

export function CloudLanding() {
  return (
    <div className="pt-16">
      <CloudLandingHero />
      <CloudLandingFeatures />
      <CloudLandingCTA />
      <CloudLandingFAQ />
    </div>
  )
}
