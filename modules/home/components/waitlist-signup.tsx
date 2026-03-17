import { Button } from '@/modules/shared/components/ui/button'
import { Input } from '@/modules/shared/components/ui/input'

export function WaitlistSignup() {
  return (
    <section className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-[var(--container-width)] px-6 py-20 text-center">
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
            className="border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground placeholder:text-primary-foreground/60 flex-1"
          />
          <Button
            type="submit"
            variant="secondary"
            size="lg"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
          >
            Subscribe
          </Button>
        </form>
      </div>
    </section>
  )
}
