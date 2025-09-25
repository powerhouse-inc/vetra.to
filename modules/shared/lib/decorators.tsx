import { Inter } from 'next/font/google'
import RootLayout from '@/app/layout'
import type { StoryContext } from '@storybook/nextjs'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
})

/**
 * Storybook decorator to apply the root layout to the page stories
 */
export const withNextjsExtras = (Story: React.ComponentType, context: StoryContext) => {
  if (context.parameters.includeLayout) {
    return (
      <RootLayout>
        <Story />
      </RootLayout>
    )
  }

  return (
    <div className={`${inter.className} antialiased`}>
      <Story />
    </div>
  )
}
