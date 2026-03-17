import { CloudLandingHero } from './cloud-landing-hero'
import { CloudLandingFeatures } from './cloud-landing-features'

export function CloudLanding() {
  return (
    <div className="pt-16">
      <CloudLandingHero />
      <CloudLandingFeatures />
    </div>
  )
}
