import { Button } from '@/modules/shared/components/ui/button'
import { Input } from '@/modules/shared/components/ui/input'
import { GridBackground } from '@/modules/shared/components/ui/grid-background'

export function WaitlistSignup() {
  return (
    <section className="relative text-foreground">
      {/* Grid background */}
      <div className="absolute inset-0 pointer-events-none">
        <GridBackground
          squareSize={30}
          strokeWidth={1}
          strokeColor="#04c161"
          topFadeDistance={0}
          topFadeIntensity={0}
          bottomFadeDistance={0}
          bottomFadeIntensity={0}
          leftFadeDistance={0}
          leftFadeIntensity={0}
          rightFadeDistance={0}
          rightFadeIntensity={0}
          className="absolute inset-0 opacity-75"
        />
        {/* CSS-based fade overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent via-transparent to-background opacity-100"></div>
      </div>
      <div className="relative z-10 mx-auto max-w-[var(--container-width)] px-6 py-20 text-center">
        <h2 className="mb-4 text-3xl font-bold">Join the Waitlist</h2>
        <p className="mx-auto mb-10 max-w-lg opacity-90">
          Own your coordination infrastructure and run it on an independent open source back-end.
        </p>

        <form
          action="https://gmail.us21.list-manage.com/subscribe/post?u=a65ca7e437961008f5f5c1bad&id=c8ea339c46&f_id=00fda7e6f0"
          method="post"
          target="_blank"
          className="mx-auto flex max-w-md gap-3"
        >
          <Input
            type="email"
            name="EMAIL"
            placeholder="you@example.com"
            required
            className="border-border bg-background text-foreground placeholder:text-foreground/60 flex-1"
          />
          <Button
            type="submit"
            variant="default"
            size="lg"
          >
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  )
}
