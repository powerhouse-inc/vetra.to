'use client'

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
      'Turn specifications into working code with spec-driven AI. Generate scaffolding, reuse modular components, and tap into the builder community.',
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
      <h2 className="text-foreground mb-4 text-center text-3xl font-bold">From Spec to Scale</h2>
      <p className="text-foreground-70 mx-auto mb-12 max-w-xl text-center">
        A five-step workflow that takes you from specification to global deployment.
      </p>

      <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
        {steps.map((step, i) => (
          <button
            key={step.label}
            onClick={() => setActiveStep(i)}
            className={`rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              i === activeStep
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {step.label}
          </button>
        ))}
      </div>

      <div className="bg-accent mx-auto max-w-2xl rounded-xl p-8 text-center">
        <h3 className="text-foreground mb-3 text-xl font-semibold">{steps[activeStep].label}</h3>
        <p className="text-foreground-70 leading-relaxed">{steps[activeStep].description}</p>
      </div>

      <div className="bg-accent mt-16 rounded-xl p-8 text-center">
        <p className="text-foreground mb-6 text-lg font-semibold">
          Get started with Vetra — The minimal stack that scales
        </p>
        <div className="text-foreground-70 mb-8 flex flex-wrap items-center justify-center gap-6 text-sm font-medium">
          <span>GraphQL</span>
          <span>TypeScript</span>
          <span>React</span>
          <span>Node.js</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild variant="secondary" size="lg">
            <Link href="https://academy.vetra.io/">Explore Academy</Link>
          </Button>
          <Button asChild size="lg">
            <Link href="/cloud">Explore Open Cloud</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
