import { createClient } from '@powerhousedao/reactor-browser'

const GRAPHQL_ENDPOINT =
  process.env.NEXT_PUBLIC_CLOUD_SWITCHBOARD_URL ||
  process.env.NEXT_PUBLIC_SWITCHBOARD_URL ||
  'https://switchboard.vetra.io/graphql'

export const DRIVE_ID = process.env.NEXT_PUBLIC_CLOUD_DRIVE_ID || 'powerhouse'

export const client = createClient(GRAPHQL_ENDPOINT)
