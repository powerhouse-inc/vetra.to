import { CloudLandingFeatures } from './cloud-landing-features'
import { CloudLandingHero } from './cloud-landing-hero'

export function CloudLanding() {
  return (
    <div className="pt-16">
      <CloudLandingHero />
      <CloudLandingFeatures />
    </div>
  )
}
