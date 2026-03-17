import Image from 'next/image'

const features = [
  {
    title: 'Rapid Application Development',
    description:
      'Turn specifications into applications with spec-driven AI. Generate scaffolding automatically, reuse modular components, and tap into an active open-source builder community.',
    image: '/images/home/feature-rad.png',
  },
  {
    title: 'Build Reactive Apps',
    description:
      "Create interfaces that react in real time. Vetra's push architecture integrates with React, putting user intent at the center and making reusable design patterns part of your workflow.",
    image: '/images/home/feature-reactive.png',
  },
  {
    title: 'Collaborative User Experiences',
    description:
      "Built 'Git-like' user experiences with branching merging & pull-requests. Applications built with Vetra are collaborative by default.",
    image: '/images/home/feature-collaborative.svg',
  },
  {
    title: 'Ready to Scale',
    description:
      "Grow from a single node to millions of users. Vetra's CQRS- and EDA-inspired architecture distributes workloads across sharded document storage.",
    image: '/images/home/feature-scale.png',
  },
  {
    title: 'Web3 Built In',
    description:
      'Add Web3 to your workflows without extra setup. Vetra supports on-chain storage, cryptographic verification, and wallet-based authentication.',
    image: '/images/home/feature-web3.png',
  },
]

export function FeatureShowcase() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
      <h2 className="text-foreground mb-16 text-center text-3xl font-bold">
        What&apos;s included?
      </h2>

      <div className="space-y-20">
        {features.map((feature, i) => (
          <div
            key={feature.title}
            className={`flex flex-col items-center gap-10 md:flex-row ${
              i % 2 === 1 ? 'md:flex-row-reverse' : ''
            }`}
          >
            <div className="flex-1">
              <h3 className="text-foreground mb-4 text-2xl font-bold">{feature.title}</h3>
              <p className="text-foreground-70 leading-relaxed">{feature.description}</p>
            </div>
            <div className="bg-accent flex-1 overflow-hidden rounded-xl">
              <Image
                src={feature.image}
                alt={feature.title}
                width={600}
                height={400}
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
