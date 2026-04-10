'use client'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/shared/components/ui/accordion'

export function CloudLandingFAQ() {
  return (
    <section id="faq" className="py-24 px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get answers to common questions about Vetra Cloud
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="what-is-vetra-cloud">
            <AccordionTrigger>What is Vetra Cloud?</AccordionTrigger>
            <AccordionContent>
              Vetra Cloud is a comprehensive cloud infrastructure platform that provides 
              scalable environments for modern applications build with Vetra. It offers automated deployment, 
              monitoring, and management tools to help developers focus on building great 
              products instead of managing infrastructure. It relies on open source technologies to avoid vendor lock-in or proprietary dependencies.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="how-to-get-started">
            <AccordionTrigger>How do I get started with Vetra Cloud?</AccordionTrigger>
            <AccordionContent>
              Getting started is simple: create your account, connect your packages, 
              and deploy your first application with our one-click deployment process. 
              Our platform automatically handles the infrastructure setup, scaling, and 
              monitoring so you can focus on your business logic.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="pricing">
            <AccordionTrigger>What are the pricing options?</AccordionTrigger>
            <AccordionContent>
              We offer flexible pricing tiers to suit different needs, from individual 
              developers to large teams. Our plans include pay-as-you-scale options with 
              transparent pricing for compute, storage, and bandwidth. Contact our team for enterprise pricing and custom solutions.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="supported-technologies">
            <AccordionTrigger>What technologies and frameworks are supported?</AccordionTrigger>
            <AccordionContent>
              Vetra Cloud supports a wide range of technologies including Node.js, Python, 
              React, Next.js, Docker containers, and many more. Our platform is designed 
              to be framework-agnostic and can run virtually any application that can be 
              containerized.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="security">
            <AccordionTrigger>How secure is Vetra Cloud?</AccordionTrigger>
            <AccordionContent>
              Security is our top priority. Although we are currently in a beta phase, we are implementing industry-standard security measures 
              including end-to-end encryption, secure networking, regular security audits, 
              and compliance with SOC 2 and other security frameworks. All data will be encrypted 
              both in transit and at rest.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scaling">
            <AccordionTrigger>How does automatic scaling work?</AccordionTrigger>
            <AccordionContent>
              Our platform automatically monitors your application's performance and resource 
              usage. When demand increases, we automatically scale your infrastructure up to 
              handle the load. When demand decreases, we scale down to optimize costs. This 
              happens seamlessly without any downtime.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="monitoring">
            <AccordionTrigger>What monitoring and analytics are available?</AccordionTrigger>
            <AccordionContent>
              Vetra Cloud provides comprehensive monitoring including real-time performance 
              metrics, application logs, error tracking, and custom dashboards. You get 
              insights into response times, resource usage, user activity, and can set up 
              alerts for important events.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="self-hosting">
            <AccordionTrigger>Can I self-host Vetra Cloud?</AccordionTrigger>
            <AccordionContent>
              Yes! Vetra Cloud is built on open-source technologies and can be self-hosted 
              on your own infrastructure. We provide comprehensive documentation, Docker 
              images, and deployment guides to help you set up your own instance. This 
              gives you complete control over your data and infrastructure while still 
              benefiting from Vetra's powerful features.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="e2ee-privacy">
            <AccordionTrigger>Is it E2EE and does it protect metadata privacy?</AccordionTrigger>
            <AccordionContent>
              Yes, Vetra Cloud is in the beta phase and will soon implement end-to-end encryption (E2EE) to ensure your data remains secure. We also protect metadata privacy through 
              advanced encryption techniques, ensuring that not only your data content but 
              also information about your data patterns and usage remains private.
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="support">
            <AccordionTrigger>What support options are available?</AccordionTrigger>
            <AccordionContent>
              We offer multiple support channels including documentation, discord, 
              email support, and priority support for enterprise customers. Our team is 
              committed to helping you succeed with responsive support.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </section>
  )
}