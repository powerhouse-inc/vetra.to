import Image from 'next/image'

export function TrustBar() {
  return (
    <section className="border-border border-y">
      <div className="mx-auto max-w-[var(--container-width)] px-6 py-12 text-center">
        <h2 className="text-foreground text-xl font-semibold">
          Build on the tech-stack of tomorrow
        </h2>
        <p className="text-foreground-70 mt-2 text-sm">
          Structured document models powered by modern tooling
        </p>

        {/* Animated connection dots */}
        <div className="my-8 flex items-center justify-center gap-3">
          <div className="bg-primary/40 h-2 w-2 animate-pulse rounded-full" />
          <div className="bg-border h-px w-8" />
          <div className="bg-primary h-3 w-3 animate-pulse rounded-full [animation-delay:200ms]" />
          <div className="bg-border h-px w-8" />
          <div className="bg-primary/60 h-2.5 w-2.5 animate-pulse rounded-full [animation-delay:400ms]" />
          <div className="bg-border h-px w-8" />
          <div className="bg-primary h-3 w-3 animate-pulse rounded-full [animation-delay:600ms]" />
          <div className="bg-border h-px w-8" />
          <div className="bg-primary/40 h-2 w-2 animate-pulse rounded-full [animation-delay:800ms]" />
        </div>

        <div className="mt-6 flex items-center justify-center gap-12">
          <Image src="/images/home/graphql.svg" alt="GraphQL" width={40} height={40} />
          <Image src="/images/home/typescript.svg" alt="TypeScript" width={40} height={40} />
          <Image src="/images/home/react.svg" alt="React" width={40} height={40} />
        </div>
      </div>
    </section>
  )
}
