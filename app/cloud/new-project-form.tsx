'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { Button } from '@/modules/shared/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shared/components/ui//form'
import { Input } from '@/modules/shared/components/ui/input'

import { createEnvironment, setEnvironmentName } from './lib/api'
import { useRefreshEnvironments } from './use-cloud-data'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export type EnvironmentFormValues = z.infer<typeof schema>

type NewEnvironmentFormProps = {
  environmentId?: string
  initialName?: string
  onSubmit?: (values: EnvironmentFormValues) => void
  onSuccess?: () => void
}

export function NewEnvironmentForm({
  environmentId,
  initialName,
  onSubmit,
  onSuccess,
}: NewEnvironmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const refreshEnvironments = useRefreshEnvironments()

  const form = useForm<EnvironmentFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialName ?? '',
    },
  })

  const handleSubmit = async (values: EnvironmentFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      if (environmentId) {
        await setEnvironmentName({
          docId: environmentId,
          name: values.name,
        })
      } else {
        await createEnvironment({
          name: values.name,
        })
      }

      setSuccess(true)
      refreshEnvironments()
      onSubmit?.(values)
      if (!environmentId) {
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save environment')
      console.error('Failed to save environment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      {/* keeping it as it comes from shadcn */}
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
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
            Environment {environmentId ? 'updated' : 'created'} successfully!
          </div>
        )}
        <div className="mt-4">
          <Button type="submit" disabled={isSubmitting} size="sm">
            {isSubmitting ? 'Saving...' : environmentId ? 'Update Name' : 'Create Environment'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
