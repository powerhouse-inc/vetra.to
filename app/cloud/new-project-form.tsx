'use client'

import { useState, useEffect } from 'react'
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

import { createProjectDocument, setProjectName, setProjectDescription } from './lib/api'
import { useProject } from './use-cloud-data'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

export type ProjectFormValues = z.infer<typeof schema>

type NewProjectFormProps = {
  projectId?: string
  initialValues?: Partial<ProjectFormValues>
  onSubmit?: (values: ProjectFormValues) => void
  onSuccess?: () => void
}

export function NewProjectForm({
  projectId,
  initialValues,
  onSubmit,
  onSuccess,
}: NewProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Load project data when in update mode
  // Always call the hook to comply with React rules (hooks must be called unconditionally)
  const loadedProject = useProject(projectId || '')
  const project = projectId ? loadedProject : undefined

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialValues?.title ?? project?.title ?? '',
      description: initialValues?.description ?? project?.description ?? '',
    },
  })

  // Update form values when project is loaded
  useEffect(() => {
    if (project) {
      form.reset({
        title: initialValues?.title ?? project.title ?? '',
        description: initialValues?.description ?? project.description ?? '',
      })
    }
  }, [project, form, initialValues])

  const handleSubmit = async (values: ProjectFormValues) => {
    try {
      setIsSubmitting(true)
      setError(null)
      setSuccess(false)

      let currentProjectId = projectId

      // Step 1: Create document (only for new projects)
      if (!currentProjectId) {
        const createResult = await createProjectDocument({
          name: values.title,
        })
        currentProjectId = createResult.data.id
      }

      // Step 2: Set name
      await setProjectName({
        docId: currentProjectId,
        name: values.title,
      })

      // Step 3: Set description (if provided)
      if (values.description) {
        await setProjectDescription({
          docId: currentProjectId,
          description: values.description,
        })
      }

      setSuccess(true)
      onSubmit?.(values)
      // Close modal on successful creation (only for new projects)
      if (!projectId) {
        onSuccess?.()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
      console.error('Failed to save project:', err)
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
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter title" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Input placeholder="Enter description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {error && <div className="text-destructive mt-2 text-sm">{error}</div>}
        {success && (
          <div className="mt-2 text-sm text-green-600">Project updated successfully!</div>
        )}
        <div style={{ marginTop: 12 }}>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : projectId ? 'Update Project' : 'Create Project'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
