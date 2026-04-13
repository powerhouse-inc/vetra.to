'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { GridBackground } from '@/modules/shared/components/ui/grid-background'
import { CreatePackageModal } from '@/app/packages/components/create-package-modal'

const phrases = ['Specification driven AI.', 'Web3 enabled features.', '100% open source.']

export function Hero() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [displayText, setDisplayText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const currentPhrase = phrases[phraseIndex]
    const timeout = setTimeout(
      () => {
        if (!isDeleting) {
          setDisplayText(currentPhrase.substring(0, displayText.length + 1))
          if (displayText.length === currentPhrase.length) {
            setTimeout(() => setIsDeleting(true), 2000)
            return
          }
        } else {
          setDisplayText(currentPhrase.substring(0, displayText.length - 1))
          if (displayText.length === 0) {
            setIsDeleting(false)
            setPhraseIndex((prev) => (prev + 1) % phrases.length)
          }
        }
      },
      isDeleting ? 40 : 80,
    )
    return () => clearTimeout(timeout)
  }, [displayText, isDeleting, phraseIndex])

  return (
    <section className="relative bg-transparent px-[74px] py-20 text-center md:py-28">
      <div className="relative mx-auto max-w-screen-xl">
        <div className="bg-primary-30 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
          Local-first
        </div>
        <h1 className="mx-auto mb-1 max-w-3xl text-[clamp(40px,5vw,64px)] leading-[1.1] font-bold tracking-tight">
          Built to scale.
        </h1>
        <p className="text-muted-foreground mx-auto mb-5 h-12 max-w-3xl text-[clamp(24px,3vw,40px)] leading-[1.2] font-bold">
          {displayText}
          <span className="border-primary ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.1em] animate-pulse border-l-2" />
        </p>
        <p className="text-foreground-70 mx-auto mb-9 max-w-xl text-lg leading-relaxed">
          Vetra helps you build any type of web application, ERP, CMS, or SaaS Backend on a reactive
          document architecture. Define workflows once, deploy them globally, and co-own the
          software you create.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <CreatePackageModal />
          <Link
            href="https://academy.vetra.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-foreground hover:bg-accent/80 inline-flex h-10 items-center rounded-lg px-8 py-3.5 text-base font-semibold transition-colors"
          >
            Explore Vetra Academy
          </Link>
        </div>

        {/* Video embed */}
        <div className="border-border mx-auto mt-12 max-w-4xl overflow-hidden rounded-xl border shadow-lg">
          {isPlaying ? (
            <div className="relative aspect-video">
              <iframe
                src="https://www.youtube.com/embed/wCrUgPrMtak?autoplay=1&rel=0"
                title="Vetra Platform Demo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          ) : (
            <button
              onClick={() => setIsPlaying(true)}
              className="group relative aspect-video w-full cursor-pointer"
            >
              <Image
                src="/images/home/hero-video-thumb.webp"
                alt="Vetra Platform Demo"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors group-hover:bg-black/20">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                  <svg
                    className="ml-1 h-6 w-6 text-gray-900"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
