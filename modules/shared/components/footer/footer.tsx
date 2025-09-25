import { PowerhouseLogoIsotype } from '../svgs'

export function Footer() {
  return (
    <footer className="bg-background/95 supports-[backdrop-filter]:bg-background/60 w-full border-t backdrop-blur">
      <div className="flex h-16 items-center justify-center">
        <div className="flex items-center">
          Made with <PowerhouseLogoIsotype className="mx-1 size-4" />
        </div>
      </div>
    </footer>
  )
}
