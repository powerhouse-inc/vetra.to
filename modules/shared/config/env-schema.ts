import { z } from 'zod'

export const envSchema = z.object({
  // private env variables
  HOMEPAGE_REMOTE_URL: z.url({
    error: 'Must be a valid URL (e.g., https://example.com) pointing to the hosted homepage.',
  }),

  // public env variables
  NEXT_PUBLIC_SWITCHBOARD_URL: z.url({
    error:
      'Must be a valid URL (e.g., https://switchboard.example.com/graphql) for the Switchboard API.',
  }),
})
