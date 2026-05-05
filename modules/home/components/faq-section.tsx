'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/modules/shared/components/ui/accordion'

const faqs = [
  {
    question: 'What can I do with Vetra?',
    answer:
      'Vetra helps you build any type of web application, ERP, CMS, or SaaS Backend on a reactive document architecture. You can browse packages from other builders, create your own packages using specification-driven AI, and deploy applications with local-first capabilities. Define workflows once, deploy them globally, and co-own the software you create.',
  },
  {
    question: 'Where to get started?',
    answer: (
      <>
        Start by exploring the{' '}
        <a
          href="https://academy.vetra.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Vetra Academy
        </a>{' '}
        for comprehensive developer documentation and tutorials. You can also get hands-on by trying
        Vetra Cloud for deployment or browsing the package ecosystem to see what others have built.
        The platform supports both technical builders and tech-enthusiasts through guided
        experiences.
      </>
    ),
  },
  {
    question: 'What code languages are required?',
    answer:
      'Vetra is built on a minimal tech stack that scales: TypeScript, GraphQL, and React. These form the core foundation, but with our specification-driven AI tooling and Academy resources, even tech-enthusiasts can build effectively without deep expertise in all technologies.',
  },
  {
    question: 'Is all code open-source?',
    answer:
      'Yes, Vetra is 100% open source. All Powerhouse code is created under the Daimon Dual Phase License (DDPL), which combines copyleft licensing with eventual permissive licensing, ensuring the codebase remains open and accessible.',
  },
  {
    question: 'How can I get support?',
    answer: (
      <>
        The easiest way to get support is through the{' '}
        <a
          href="https://discord.com/invite/pwQJwgaQKd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Powerhouse Discord server
        </a>{' '}
        where you can directly communicate with the team and community. You can also find
        comprehensive documentation and tutorials at the{' '}
        <a
          href="https://academy.vetra.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Vetra Academy
        </a>
        .
      </>
    ),
  },
  {
    question: 'Can I integrate other tools?',
    answer:
      'Absolutely! Vetra is designed as an open framework that welcomes integration with your preferred tools and services. The reactive document architecture and modular package system make it easy to extend and customize for your specific needs.',
  },
  {
    question: 'What is Vetra Cloud?',
    answer:
      'Vetra Cloud is a real-time sync and storage infrastructure that scales your workflows up to millions of users. It provides hosting and deployment solutions for builders, teams, and organizations, following the principle of "Documents as code, code as infrastructure."',
  },
  {
    question: 'What is Switchboard?',
    answer:
      'Switchboard is a portal for managing remote instances and accessing APIs within the Vetra ecosystem. It serves as the central hub for cloud environment management and provides the GraphQL endpoints that power the platform.',
  },
  {
    question: 'How can I contribute?',
    answer: (
      <>
        You can contribute to Vetra through the Powerhouse GitHub repository, join the community
        discussions on{' '}
        <a
          href="https://discord.com/invite/pwQJwgaQKd"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Discord
        </a>
        , create and share packages, or contribute to the{' '}
        <a
          href="https://academy.vetra.io/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline"
        >
          Academy
        </a>{' '}
        documentation. The open-source nature welcomes contributions at all levels.
      </>
    ),
  },
  {
    question: 'What blockchains do you integrate with?',
    answer:
      'Vetra currently supports Web3 authentication through Ethereum and Solana wallets via the Renown identity system. This enables blockchain-based login and identity management across all host applications in the ecosystem.',
  },
]

const leftColumn = faqs.slice(0, 5)
const rightColumn = faqs.slice(5, 10)

export function FaqSection() {
  return (
    <section className="mx-auto max-w-screen-xl px-6 py-20">
      <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
        Frequently Asked Questions
      </h2>
      <p className="text-foreground-70 mb-12 text-center">Everything you need to know.</p>

      <div className="grid gap-12 lg:grid-cols-2">
        <Accordion type="multiple">
          {leftColumn.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`left-${i}`}
              className="border-border/30 border-b-[0.5px] py-2 last:border-b-0"
            >
              <AccordionTrigger className="py-6 text-base">{faq.question}</AccordionTrigger>
              <AccordionContent className="pb-6">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <Accordion type="multiple">
          {rightColumn.map((faq, i) => (
            <AccordionItem
              key={i}
              value={`right-${i}`}
              className="border-border/30 border-b-[0.5px] py-2 last:border-b-0"
            >
              <AccordionTrigger className="py-6 text-base">{faq.question}</AccordionTrigger>
              <AccordionContent className="pb-6">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
