'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'

const rdaFeatures = [
  {
    title: 'Reactive',
    description: 'Realtime, responsive, message driven. With an elastic scalable architecture.',
  },
  {
    title: 'Document',
    description:
      'Documents as a local first, self contained data structure and node in a decentralized network.',
  },
  {
    title: 'Architecture',
    description: 'EDA / CQRS inspired with read models for data aggregation and scalability.',
  },
  {
    title: 'Git-like',
    description:
      'State of the art editing UX that offers history branching, merging, and commenting.',
  },
  {
    title: 'Stateful',
    description:
      "Documents with a document history and well-defined operations as state transitions become mini-api's.",
  },
  {
    title: 'Sagas',
    description:
      'Workflow sagas are the orchestration layer that combine multiple documents into a process with specific stage gates.',
  },
]

export function FeaturesTabs() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
      <Tabs defaultValue="rda" className="items-center">
        <TabsList className="mb-10">
          <TabsTrigger value="rda">Reactive Document Architecture</TabsTrigger>
          <TabsTrigger value="spec-ai">Specification Driven AI</TabsTrigger>
        </TabsList>

        <TabsContent value="rda">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rdaFeatures.map((feature) => (
              <div
                key={feature.title}
                className="border-border hover:bg-accent rounded-xl border p-6 transition-colors"
              >
                <h3 className="text-foreground mb-2 text-base font-bold">{feature.title}</h3>
                <p className="text-foreground-70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="spec-ai">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="border-border hover:bg-accent rounded-xl border p-6 transition-colors">
              <h3 className="text-foreground mb-2 text-base font-bold">Spec-Driven Generation</h3>
              <p className="text-foreground-70 text-sm leading-relaxed">
                Turn document model specifications into working code. AI understands your schema and
                generates scaffolding automatically.
              </p>
            </div>
            <div className="border-border hover:bg-accent rounded-xl border p-6 transition-colors">
              <h3 className="text-foreground mb-2 text-base font-bold">Context-Aware Tooling</h3>
              <p className="text-foreground-70 text-sm leading-relaxed">
                AI tools that understand your document models, operations, and workflows to provide
                relevant suggestions and completions.
              </p>
            </div>
            <div className="border-border hover:bg-accent rounded-xl border p-6 transition-colors">
              <h3 className="text-foreground mb-2 text-base font-bold">Community Patterns</h3>
              <p className="text-foreground-70 text-sm leading-relaxed">
                Leverage patterns and components from the builder community. Reuse proven
                specifications to accelerate development.
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
