import { BookMeetingModal } from './book-meeting-modal'

export function CloudLandingCTA() {
  return (
    <section className="py-16 px-6 lg:px-8 bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Schedule a personalized demo to see how Vetra Cloud can accelerate 
          your development workflow and scale your applications with ease.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <BookMeetingModal />
          <p className="text-sm text-muted-foreground">
            or explore our{' '}
            <a href="#faq" className="text-primary hover:underline">
              frequently asked questions
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}