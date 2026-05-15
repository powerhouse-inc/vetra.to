'use client'

import { Database, Globe, Shield } from 'lucide-react'
import Image from 'next/image'
import { useState, startTransition } from 'react'

const logos = [
  {
    name: 'Kubernetes',
    src: '/images/cloud/logos/kubernetes.png',
  },
  {
    name: 'PostgreSQL',
    src: '/images/cloud/logos/postgres.svg.png',
  },
  {
    name: 'Grafana',
    src: '/images/cloud/logos/grafana.webp',
  },
  {
    name: 'Prometheus',
    src: '/images/cloud/logos/Prometheus.png',
  },
  {
    name: 'OpenBao',
    src: '/images/cloud/logos/openbao.svg',
  },
  {
    name: 'Harbor',
    src: '/images/cloud/logos/harbor.svg',
  },
  {
    name: 'Argo',
    src: '/images/cloud/logos/argo.svg',
  },
  {
    name: 'Verdaccio',
    src: '/images/cloud/logos/verdaccio.svg',
  },
]

function Principle({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="bg-primary-30 flex h-12 w-12 items-center justify-center rounded-xl">
        <Icon className="text-primary h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-foreground-70 max-w-xs text-sm leading-relaxed">{description}</p>
    </div>
  )
}

function FeatureSection({
  title,
  subtitle,
  description,
  image,
  reversed,
}: {
  title: string
  subtitle: string
  description: string | string[] | React.ReactNode[]
  image: string
  reversed?: boolean
}) {
  return (
    <div
      className={`flex flex-col items-center gap-10 md:flex-row ${reversed ? 'md:flex-row-reverse' : ''}`}
    >
      <div className="flex-1 space-y-3">
        <div className="bg-primary-30 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
          {subtitle}
        </div>
        <h3 className="text-2xl leading-tight font-bold">{title}</h3>
        <div className="text-foreground-70 space-y-4 leading-relaxed">
          {Array.isArray(description) ? (
            description.map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p>{description}</p>
          )}
        </div>
      </div>
      <div className="bg-accent flex w-full flex-1 items-center justify-center overflow-hidden rounded-2xl">
        <Image
          src={image}
          alt={title}
          width={600}
          height={400}
          className="h-auto w-full object-cover"
        />
      </div>
    </div>
  )
}

export function CloudLandingFeatures() {
  const [hoveredLogo, setHoveredLogo] = useState<string | null>(null)

  return (
    <div id="features">
      {/* Infrastructure bar */}
      <section className="from-primary-30/50 to-primary-30 bg-gradient-to-b px-6 py-12">
        <div className="mx-auto max-w-screen-xl text-center">
          <p className="text-foreground text-3xl font-bold">Vetra Cloud is built on</p>
          <p className="text-foreground-70 mt-2 mb-16 text-2xl">
            {hoveredLogo || 'battle tested open source tools'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8">
            {logos.map((logo, index) => (
              <Image
                key={index}
                src={logo.src}
                alt={logo.name}
                width={80}
                height={80}
                className="h-20 w-20 cursor-pointer object-contain opacity-60 grayscale transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] hover:opacity-100 hover:grayscale-0"
                onMouseEnter={() => startTransition(() => setHoveredLogo(logo.name))}
                onMouseLeave={() => startTransition(() => setHoveredLogo(null))}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Key principles */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-screen-xl">
          <h2 className="mb-12 text-center text-2xl font-bold">Built on open principles</h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <Principle
              icon={Database}
              title="Data Ownership"
              description="Your data stays yours. Export, migrate, or self-host at any time with no vendor lock-in."
            />
            <Principle
              icon={Shield}
              title="Local-First Resilience"
              description="Applications remain functional offline with local-first architecture and seamless sync."
            />
            <Principle
              icon={Globe}
              title="Sovereignty by Default"
              description="Choose your jurisdiction, your infrastructure, and your terms of operation."
            />
          </div>
        </div>
      </section>

      {/* Alternating feature sections */}
      <section className="space-y-20 px-6 py-12">
        <div className="mx-auto max-w-screen-xl space-y-20">
          <FeatureSection
            subtitle="Ownership"
            title="Open cloud. Clear sky."
            description="Full data ownership with a clear self-hosting path. No black boxes, no proprietary APIs. Run Vetra Cloud managed or bring it to your own infrastructure."
            image="/images/cloud/cloud-layers.svg"
          />
          <FeatureSection
            subtitle="Freedom"
            title="Cloud without Captivity."
            description={[
              <>
                A <strong>pluggable anchoring layer</strong> that is storage-agnostic by design.
                Switch between storage backends, anchoring providers, and sync protocols without
                rewriting your application.
              </>,
              <>
                Powerhouse Reactors are the nodes in the network that store documents, resolve
                conflicts and verify document event histories. Reactors can be configured for local
                storage, centralized cloud storage, or decentralized networks - giving you complete
                control over where and how your data is stored.
              </>,
              <>
                Document histories are append-only, which means they can be stored in both{' '}
                <strong>mutable and immutable repositories</strong>. Whether as files, in browsers,
                databases, or on the blockchain - different storage options for different use cases,
                all accessible through the same unified interface.
              </>,
            ]}
            image="/images/cloud/cloud-architecture.png"
            reversed
          />
          <FeatureSection
            subtitle="Purpose-built"
            title="Made for Vetra apps."
            description="Vetra Cloud is designed specifically to run apps built with Vetra. Real-time collaboration, automatic sync, and instant updates all work out of the box."
            image="/images/cloud/powerhouse-package.png"
          />
        </div>
      </section>
    </div>
  )
}
