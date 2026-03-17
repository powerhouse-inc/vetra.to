'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export function Hero() {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <section className="px-6 py-20 text-center md:py-28">
      <div className="mx-auto max-w-[var(--container-width)]">
        <div className="bg-primary-30 text-primary mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold">
          Local-first. Built to Scale.
        </div>
        <h1 className="mx-auto mb-5 max-w-3xl text-[clamp(40px,5vw,64px)] leading-[1.1] font-bold tracking-tight">
          Local first. Built to scale.
        </h1>
        <p className="text-foreground-70 mx-auto mb-9 max-w-xl text-lg leading-relaxed">
          Vetra helps you build any type of web application, ERP, CMS, or SaaS Backend on a reactive
          document architecture. Define workflows once, deploy them globally, and co-own the
          software you create.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/cloud"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center rounded-lg px-8 py-3.5 text-base font-semibold transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="https://academy.vetra.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-accent text-foreground hover:bg-accent/80 inline-flex items-center rounded-lg px-8 py-3.5 text-base font-semibold transition-colors"
          >
            Explore Academy
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
                    className="text-foreground ml-1 h-6 w-6"
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
