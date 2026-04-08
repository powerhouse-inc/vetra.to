'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRenown } from '@powerhousedao/reactor-browser'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  getAuthToken,
  createEnvironment,
  setLabel,
  initializeEnvironment,
  enableService,
} from '@/modules/cloud/graphql'
import { generateSubdomain } from '@/modules/cloud/subdomain'
import { Button } from '@/modules/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shared/components/ui/form'
import { Input } from '@/modules/shared/components/ui/input'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export type EnvironmentFormValues = z.infer<typeof schema>

type NewEnvironmentFormProps = {
  docId?: string
  initialName?: string
  onCreated?: (id: string) => void
  onSuccess?: () => void
}

export function NewEnvironmentForm({
  docId,
  initialName,
  onCreated,
  onSuccess,
}: NewEnvironmentFormProps) {
  const renown = useRenown()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName ?? '',
    },
  })

  const isRenameMode = !!docId

  const handleSubmit = async (values: EnvironmentFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      const token = await getAuthToken(renown)

      if (docId) {
        await setLabel(docId, values.name, token)
      } else {
        const env = await createEnvironment(values.name, token)
        const subdomain = generateSubdomain(env.id)
        await initializeEnvironment(
          env.id,
          subdomain,
          'vetra.io',
          'https://registry.dev.vetra.io',
          token,
        )
        await enableService(env.id, 'CONNECT', 'connect', token)
        await setLabel(env.id, values.name, token)
        onCreated?.(env.id)
      }

      setSuccess(true)
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save environment')
      console.error('Failed to save environment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter environment name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {error && <div className="text-destructive mt-2 text-sm">{error}</div>}
        {success && (
          <div className="mt-2 text-sm text-green-600">
            Environment {isRenameMode ? 'updated' : 'created'} successfully!
          </div>
        )}
        <div className="mt-4">
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Saving...' : isRenameMode ? 'Update Name' : 'Create Environment'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
