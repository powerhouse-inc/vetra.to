'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRenown } from '@powerhousedao/reactor-browser'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import type { EnvironmentController } from '@/modules/cloud/controller'
import { createEnvironmentController } from '@/modules/cloud/controller'
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
  controller?: EnvironmentController
  onPush?: () => Promise<void>
  initialName?: string
  onCreated?: (id: string) => void
  onSuccess?: () => void
}

export function NewEnvironmentForm({
  controller,
  onPush,
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

  const isRenameMode = !!controller

  const handleSubmit = async (values: EnvironmentFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      if (controller) {
        controller.setEnvironmentName({ name: values.name })
        await onPush?.()
      } else {
        const ctrl = await createEnvironmentController({ signer: renown?.signer })
        ctrl.setEnvironmentName({ name: values.name })
        const result = await ctrl.push()
        onCreated?.(result.remoteDocument.id)
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
      {/* keeping it as it comes from shadcn */}
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
