'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, startTransition } from 'react'

import { Button } from '@/modules/shared/components/ui/button'

const languages = [
  {
    name: 'GraphQL',
    logo: '/images/home/graphql.svg',
  },
  {
    name: 'TypeScript',
    logo: '/images/home/typescript.svg',
  },
  {
    name: 'React',
    logo: '/images/home/react.svg',
  },
]

export function SpecToScale() {
  const [hoveredLanguage, setHoveredLanguage] = useState<string | null>(null)

  return (
    <section className="mx-auto max-w-screen-xl px-6 py-20">
      {/* Get started section */}
      <div className="mb-10 text-center">
        <p className="text-foreground text-3xl font-bold">Get started with Vetra</p>
        <p className="text-foreground-70 mt-2 text-2xl transition-all duration-500 ease-out">
          {hoveredLanguage || 'The minimal stack that scales'}
        </p>
      </div>

      <div className="mb-10 flex items-center justify-center gap-12">
        {languages.map((language, index) => {
          const isHovered = hoveredLanguage === language.name
          return (
            <div
              key={index}
              className={`flex h-20 w-20 cursor-pointer items-center justify-center rounded-2xl border p-4 transition-all duration-500 ease-out ${
                isHovered ? 'border-border bg-background' : 'border-transparent bg-transparent'
              }`}
              onMouseEnter={() => startTransition(() => setHoveredLanguage(language.name))}
              onMouseLeave={() => startTransition(() => setHoveredLanguage(null))}
            >
              <Image
                src={language.logo}
                alt={language.name}
                width={56}
                height={56}
                className={`transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isHovered ? 'filter-none' : 'brightness-50 grayscale filter'
                }`}
              />
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-center gap-4">
        <Button asChild size="lg">
          <Link href="/cloud">Explore Vetra Cloud</Link>
        </Button>
        <Button asChild size="lg">
          <Link href="https://academy.vetra.io/">Explore Vetra Academy</Link>
        </Button>
      </div>
    </section>
  )
}
