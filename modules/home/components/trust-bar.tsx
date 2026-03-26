import Image from 'next/image'

export function TrustBar() {
  return (
    <section className="border-border border-b">
      <div className="mx-auto max-w-[var(--container-width)] px-6 py-12 text-center">
        <div className="flex items-center justify-center gap-12">
          <Image src="/images/home/graphql.svg" alt="GraphQL" width={40} height={40} />
          <Image src="/images/home/typescript.svg" alt="TypeScript" width={40} height={40} />
          <Image src="/images/home/react.svg" alt="React" width={40} height={40} />
        </div>
      </div>
    </section>
  )
}
