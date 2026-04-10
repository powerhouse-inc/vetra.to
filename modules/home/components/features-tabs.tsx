'use client'

import {
  BookOpen,
  Clock,
  Code,
  Cog,
  Database,
  FileText,
  FlaskConical,
  GitBranch,
  Layers,
  Lightbulb,
  MessageSquare,
  Radio,
  RefreshCcw,
  ShieldCheck,
  Users,
  Workflow,
  Zap,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/modules/shared/components/ui/tabs'
import type { LucideIcon } from 'lucide-react'

type Feature = { title: string; description: string; icon: LucideIcon }

const specAiFeatures: Feature[] = [
  {
    title: 'Code is dead.',
    description:
      'Communicate your solution and intent through a structured specification framework designed for AI collaboration',
    icon: MessageSquare,
  },
  {
    title: 'Specs as shared language',
    description: 'They enable precise, iterative edits—turning messy intent into clean execution.',
    icon: Users,
  },
  {
    title: 'Build for AI',
    description:
      "Our documents are machine-readable and executable—laying the groundwork for a 'Git for Intent' for your AI agents.",
    icon: Zap,
  },
  {
    title: 'Iterate in lockstep.',
    description:
      'Update exact parameters and properties as your specs evolve—no more guesswork, just precision.',
    icon: RefreshCcw,
  },
  {
    title: 'Stop vibecoding. Start delivering.',
    description:
      'Specs turn fragile sandcastles into solid, editable, and maintainable functionality.',
    icon: Code,
  },
  {
    title: 'Maintainable by design',
    description:
      'Turn business needs into document models, specs into unit tests, and intent into living documentation.',
    icon: Cog,
  },
]

const rdaFeatures: Feature[] = [
  {
    title: 'Reactive',
    description: 'Realtime, responsive, message driven. With an elastic scalable architecture.',
    icon: Radio,
  },
  {
    title: 'Document',
    description:
      'Documents as a local first, self contained data structure and node in a decentralized network.',
    icon: FileText,
  },
  {
    title: 'Architecture',
    description: 'EDA / CQRS inspired with read models for data aggregation and scalability.',
    icon: Layers,
  },
  {
    title: 'Git-like',
    description:
      'State of the art editing UX that offers history branching, merging, and commenting.',
    icon: GitBranch,
  },
  {
    title: 'Stateful',
    description:
      "Documents with a document history and well-defined operations as state transitions become mini-api's.",
    icon: RefreshCcw,
  },
  {
    title: 'Sagas',
    description:
      'Workflow sagas are the orchestration layer that combine multiple documents into a process with specific stage gates.',
    icon: Workflow,
  },
]

export function FeaturesTabs() {
  return (
    <section className="mx-auto max-w-screen-xl px-[74px] py-20">
      <div className="mb-12 text-center">
        <h2 className="text-foreground mb-2 text-3xl font-bold">
          Build on the sovereign tech-stack of tomorrow
        </h2>
        <p className="text-foreground-70 mt-2 text-2xl transition-all duration-500 ease-out">
          Structured document models powered by modern tooling
        </p>
      </div>
      <Tabs defaultValue="rda" className="items-center">
        <TabsList className="mb-10">
          <TabsTrigger value="rda" className="text-lg">
            Reactive Document Architecture
          </TabsTrigger>
          <TabsTrigger value="spec-ai" className="text-lg">
            Specification Driven AI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rda">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rdaFeatures.map((feature) => (
              <div
                key={feature.title}
                className="border-border hover:bg-accent rounded-xl border p-6 transition-colors"
              >
                <feature.icon className="text-primary mb-2 h-6 w-6" />
                <h3 className="text-foreground mb-2 text-base font-bold">{feature.title}</h3>
                <p className="text-foreground-70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="spec-ai">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specAiFeatures.map((feature) => (
              <div
                key={feature.title}
                className="border-border hover:bg-accent rounded-xl border p-6 transition-colors"
              >
                <feature.icon className="text-primary mb-2 h-6 w-6" />
                <h3 className="text-foreground mb-2 text-base font-bold">{feature.title}</h3>
                <p className="text-foreground-70 text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
