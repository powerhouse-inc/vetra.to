'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

import { Button } from '@/modules/shared/components/ui/button'

const steps = [
  {
    label: 'Specify',
    description:
      'Define workflows in one shared language that bridges developers and analysts. Use Vetra Studio to capture and organize every specification in a single source of truth.',
  },
  {
    label: 'Build',
    description:
      'Build applications with reusable components and a \u2018batteries-included\u2019 framework for auth, chat, and encryption. Package your workflows so others can install and extend them.',
  },
  {
    label: 'Launch',
    description:
      'Deploy to Vetra Cloud with a single command. Your reactive document architecture scales from prototype to production seamlessly.',
  },
  {
    label: 'Automate',
    description:
      'Set up workflow sagas to orchestrate complex processes. Combine documents into automated pipelines with specific stage gates.',
  },
  {
    label: 'Scale',
    description:
      'Grow from a single node to millions of users. CQRS and EDA-inspired architecture distributes workloads with consistent performance.',
  },
]

export function SpecToScale() {
  const [activeStep, setActiveStep] = useState(0)

  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
      <h2 className="text-foreground mb-10 text-center text-4xl font-bold">From spec to scale.</h2>

      {/* Pill tab bar */}
      <div className="border-border/60 mx-auto mb-8 flex w-fit items-center rounded-full border p-1">
        {steps.map((step, i) => (
          <button
            key={step.label}
            onClick={() => setActiveStep(i)}
            className={`rounded-full px-6 py-2.5 text-sm font-medium transition-all ${
              i === activeStep
                ? 'border-primary/50 text-foreground border bg-transparent shadow-sm'
                : 'text-foreground-70 hover:text-foreground border border-transparent'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <p
        key={activeStep}
        className="text-foreground-70 mx-auto mb-16 max-w-2xl text-center text-base leading-relaxed"
      >
        {steps[activeStep].description}
      </p>

      {/* Get started section */}
      <div className="mb-10 text-center">
        <p className="text-foreground text-3xl font-bold">Get started with Vetra</p>
        <p className="text-foreground-70 mt-2 text-2xl">The minimal stack that scales</p>
      </div>

      <div className="mb-10 flex items-center justify-center gap-12">
        <Image src="/images/home/graphql.svg" alt="GraphQL" width={56} height={56} />
        <Image src="/images/home/typescript.svg" alt="TypeScript" width={56} height={56} />
        <Image src="/images/home/react.svg" alt="React" width={56} height={56} />
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="https://academy.vetra.io/">Explore Academy</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="/cloud">Explore Open Cloud</Link>
        </Button>
      </div>
    </section>
  )
}
