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
      'Vetra is the builder platform of the Powerhouse ecosystem. It allows you to browse the packages of other builders or start building your own package by defining document models, user experiences and data integrations with the help of specification driven AI.',
  },
  {
    question: 'Where to get started?',
    answer:
      'A good place to start is the Powerhouse Academy developer documentation. Here we guide you through the process of creating your first package in Vetra Studio.',
  },
  {
    question: 'What code languages are required?',
    answer:
      'Knowledge of Typescript and GraphQL are recommended. But even for tech-enthusiasts you can get far with the help of our Academy, the PH-CLI and the specification driven AI tooling we provide.',
  },
  {
    question: 'Is all code open-source?',
    answer:
      'All Powerhouse code is created under the Daimon Dual Phase License (DDPL), which combines copyleft licensing with eventual permissive licensing.',
  },
  {
    question: 'How can I get support?',
    answer:
      'The easiest way to talk directly with the Powerhouse team is through their Discord server.',
  },
  {
    question: 'Can I integrate other tools?',
    answer: 'We invite you to integrate your preferred tools into our open source framework.',
  },
  {
    question: 'What is Vetra Cloud?',
    answer:
      'Vetra Cloud is a hosting and deployment solution for builders, teams and organizations to host their Powerhouse Stack in the Ecosystem.',
  },
  {
    question: 'What is Switchboard?',
    answer:
      'Switchboard is a portal through which you can manage remote instances and get access to the API.',
  },
  {
    question: 'How can I contribute?',
    answer: 'Please find the way to contribute in the Powerhouse GitHub repository.',
  },
  {
    question: 'What blockchains do you integrate with?',
    answer: "Currently you're able to login with Ethereum and Solana into our host applications.",
  },
]

const leftColumn = faqs.slice(0, 5)
const rightColumn = faqs.slice(5, 10)

export function FaqSection() {
  return (
    <section className="mx-auto max-w-[var(--container-width)] px-6 py-20">
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
