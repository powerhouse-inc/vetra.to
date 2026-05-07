'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion'

export function CloudLandingFAQ() {
  const faqs = [
    {
      question: 'What is Vetra Cloud?',
      answer:
        'Vetra Cloud is our hosted option for running apps built with Vetra. We handle the servers, storage, scaling, and monitoring so you can focus on your work. It is built entirely on open source tools, so there are no hidden dependencies or lock-in.',
    },
    {
      question: 'How do I get started?',
      answer:
        'Create your account, connect your first app, and deploy with one click. The platform handles setup and scaling automatically so you can focus on what your team actually needs to do.',
    },
    {
      question: 'What does it cost?',
      answer:
        'We offer flexible plans to fit teams of all sizes — from individual builders to large organizations. Pricing scales with your usage and is always transparent. Contact us for enterprise or custom pricing.',
    },
    {
      question: 'What kind of apps can I run on Vetra Cloud?',
      answer:
        'Any app built with Vetra. The platform is also framework-friendly and can run containerized apps built with Node.js, Python, React, Next.js, and many more. If it runs in a container, it can run on Vetra Cloud.',
    },
    {
      question: 'How secure is it?',
      answer:
        'Security is built in from the start. All data is encrypted in transit and at rest. We are working toward end-to-end encryption, regular security audits, and compliance certifications. We will keep you updated as these features roll out.',
    },
    {
      question: 'How does scaling work?',
      answer:
        'Automatically. The platform monitors your app and adjusts capacity as traffic goes up or down. You never need to think about it — and you only pay for what you use.',
    },
    {
      question: 'What can I monitor?',
      answer:
        'Vetra Cloud gives you a real-time view of your app: performance, logs, errors, and usage. You can set up alerts for anything important and build custom dashboards for your team.',
    },
    {
      question: 'Can I run Vetra Cloud on my own servers?',
      answer:
        'Yes. Vetra Cloud is open source and fully self-hostable. We provide documentation, Docker images, and step-by-step guides to get your own instance running. Your data, your hardware, your rules.',
    },
    {
      question: 'Is my data encrypted and private?',
      answer:
        'Yes. All data is encrypted in transit and at rest. We are actively building end-to-end encryption so even we cannot read your data. Your privacy matters and we will never sell or share your information.',
    },
    {
      question: 'What support is available?',
      answer:
        'We offer documentation, a community Discord, email support, and priority support for larger plans. Our team is responsive and committed to helping you succeed.',
    },
  ]

  const leftColumn = faqs.slice(0, 5)
  const rightColumn = faqs.slice(5, 10)

  return (
    <section id="faq" className="mx-auto max-w-screen-xl px-6 py-20">
      <h2 className="text-foreground mb-2 text-center text-3xl font-bold">
        Frequently Asked Questions
      </h2>
      <p className="text-foreground-70 mb-12 text-center">
        Everything you need to know about Vetra Cloud.
      </p>

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
