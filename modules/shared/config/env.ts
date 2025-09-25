import z from 'zod'
import { envSchema } from './env-schema'

export const validateEnv = () => {
  try {
    envSchema.parse(process.env)
    console.info(' \x1b[1m\x1b[32m✓\x1b[0m Environment variables loaded successfully')
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(' \x1b[1m\x1b[31m⚠\x1b[0m Environment variables validation failed\n')

      error.issues.forEach((err) => {
        console.error(`   - \x1b[31m${err.path.join('.')}\x1b[0m: ${err.message}`)
      })
    } else {
      console.error(' \x1b[31m⚠\x1b[0m Unexpected error during environment validation:', error)
    }

    console.log()
    process.exit(1)
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface ProcessEnv extends z.infer<typeof envSchema> {}
  }
}
