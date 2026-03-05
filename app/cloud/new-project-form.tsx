'use client'

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

import { getProject } from './mock-data'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
})

export type ProjectFormValues = z.infer<typeof schema>

type NewProjectFormProps = {
  projectId?: string
  initialValues?: Partial<ProjectFormValues>
  onSubmit?: (values: ProjectFormValues) => void
}

export function NewProjectForm({ projectId, initialValues, onSubmit }: NewProjectFormProps) {
  const loadedProject = projectId ? getProject(projectId) : undefined

  const defaultValues: ProjectFormValues = {
    title: initialValues?.title ?? loadedProject?.title ?? '',
    description: initialValues?.description ?? loadedProject?.description ?? '',
  }

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  return (
    <Form {...form}>
      {/* keeping it as it comes from shadcn */}
      {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
      <form
        onSubmit={form.handleSubmit((values) => {
          onSubmit?.(values)
        })}
      >
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
        <div style={{ marginTop: 12 }}>
          <Button type="submit">{projectId ? 'Update Project' : 'Create Project'}</Button>
        </div>
      </form>
    </Form>
  )
}
