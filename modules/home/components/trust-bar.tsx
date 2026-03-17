import Image from 'next/image'

import { DotLottiePlayer } from '@/shared/components/ui/dotlottie-player'

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

        <div className="my-8 flex items-center justify-center">
          <DotLottiePlayer
            src="https://cdn.lottielab.com/l/9XUKpHqvBQ2jGy.json"
            className="h-[28rem] w-full max-w-5xl"
          />
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
