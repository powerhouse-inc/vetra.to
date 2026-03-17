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

        <div className="mt-8 flex flex-wrap items-center justify-center gap-12">
          <span className="text-foreground text-lg font-medium tracking-wide">GraphQL</span>
          <span className="text-foreground text-lg font-medium tracking-wide">TypeScript</span>
          <span className="text-foreground text-lg font-medium tracking-wide">React</span>
        </div>
      </div>
    </section>
  )
}
