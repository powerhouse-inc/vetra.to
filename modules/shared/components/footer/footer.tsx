import { ThemeToggle } from '../theme-toggle'

export function Footer() {
  return (
    <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full border-t backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-center px-4">
        <div>Vetra - Coming soon</div>
        <ThemeToggle />
      </div>
    </footer>
  )
}
