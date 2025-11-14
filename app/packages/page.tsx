import React from 'react'

import { JoinedUsersBadge } from '@/modules/shared/components/joined-users-badge'

export const metadata: unknown = {
  title: 'Vetra Packages',
  description:
    'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
  openGraph: {
    title: 'Vetra Packages',
    description:
      'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
    url: 'https://vetra.to/packages',
    siteName: 'Vetra',
    type: 'website',
    images: [
      {
        url: 'https://vetra.to/vetra-logo.png',
        width: 1200,
        height: 630,
        alt: 'Vetra Packages',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vetra Packages',
    description:
      'Explore Vetra packages - a collection of document models, editors, and module resources providing solutions for specific domains and industries.',
    images: ['https://vetra.to/vetra-logo.png'],
    site: '@vetra',
  },
  alternates: {
    canonical: 'https://vetra.to/packages',
  },
}

export default async function PackagesPage() {
  return (
    <div className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Packages</h1>
        <p>
          Packages are a collection of document models, document model editors, and other module
          resources that are published as a package and can be used in any of the host applications.
          Packages provide solutions to within specific domains and industries.
        </p>
      </div>

      {/* Breadcrumb */}
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <span>Packages</span>
        <span>&gt;</span>
        <span className="font-medium">Overview</span>
      </div>

      {/* Waitlist Section */}
      <div className="flex min-h-[500px] flex-col items-center justify-center space-y-8 py-12">
        <div className="max-w-3xl space-y-6 text-center">
          <h2 className="text-5xl font-bold tracking-tight">Join the Waitlist</h2>

          <p className="text-muted-foreground text-lg">
            Sign up to stay in the loop & be amongst the first builders on Vetra!
          </p>

          {/* Newsletter Iframe */}
          <div className="flex justify-center pt-4">
            <iframe
              src="https://paragraph.com/@powerhouse/embed?minimal=true"
              width="480"
              height="45"
              style={{ border: '1px solid #EEE', background: 'white' }}
              frameBorder="0"
              scrolling="no"
              title="Newsletter Signup"
            />
          </div>

          {/* Optional: Add avatar stack or counter similar to the reference image */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <JoinedUsersBadge />
          </div>
        </div>
      </div>
    </div>
  )
}
