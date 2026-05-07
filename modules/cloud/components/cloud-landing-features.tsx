'use client'

import { Database, Globe, Shield } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
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
            {hoveredLogo || 'trusted open source tools'}
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
          <h2 className="mb-12 text-center text-2xl font-bold">Our promises to you</h2>
          <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
            <Principle
              icon={Database}
              title="Your data is yours"
              description="Download, move, or host it yourself at any time. No permission needed."
            />
            <Principle
              icon={Shield}
              title="Works offline too"
              description="Your apps keep running without internet. Changes sync automatically when you're back online."
            />
            <Principle
              icon={Globe}
              title="You're always in charge"
              description="Choose where your data lives and what rules govern it. No surprises."
            />
          </div>
        </div>
      </section>

      {/* Alternating feature sections */}
      <section className="space-y-20 px-6 py-12">
        <div className="mx-auto max-w-screen-xl space-y-20">
          <FeatureSection
            subtitle="Transparency"
            title="No surprises, ever."
            description="Run Vetra Cloud hosted for you, or set it up on your own servers. Everything is open source — no hidden code, no black boxes."
            image="/images/cloud/cloud-layers.svg"
          />
          <FeatureSection
            subtitle="Flexibility"
            title="Switch anytime, no headaches."
            description={[
              'Move between storage providers without rewriting your app. Connect to files, databases, or even the blockchain — one interface works with all of them.',
              'You choose where your data lives: a managed server, your own hardware, or a decentralized network. Changing your mind later is always an option.',
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
