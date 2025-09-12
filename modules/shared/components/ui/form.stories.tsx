import type { Meta, StoryObj } from '@storybook/nextjs'
import React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from './form'
import { Input } from './input'
import { Button } from './button'

// Wrapper component so story args don't need to satisfy react-hook-form's UseFormReturn
function FormExample() {
  const schema = z.object({ email: z.string().email() })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  })
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(() => {})} style={{ width: 320 }}>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div style={{ marginTop: 12 }}>
          <Button type="submit">Submit</Button>
        </div>
      </form>
    </Form>
  )
}

const meta = {
  title: 'Shared/Shadcn/Form',
  component: FormExample,
  tags: ['autodocs'],
  parameters: { layout: 'centered' },
} satisfies Meta<typeof FormExample>

export default meta
type Story = StoryObj<typeof meta>

export const Basic: Story = {
  args: {},
  render: () => <FormExample />,
}
