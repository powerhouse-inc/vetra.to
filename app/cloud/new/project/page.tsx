import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/modules/shared/components/ui/breadcrumb'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { z } from 'zod'

import { Button } from '@/modules/shared/components/ui/button'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/modules/shared/components/ui/accordion'

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/modules/shared/components/ui//form'
import { Input } from '@/modules/shared/components/ui/input'

// Force dynamic rendering to prevent build-time API requests
export const dynamic = 'force-dynamic'

export const metadata: unknown = {
  title: 'Vetra Cloud',
  description: 'The Cloud for Powerhouse!',
}

export default function NewProjectPage() {
  // const schema = z.object({ email: z.string().email() })
  // const form = useForm<z.infer<typeof schema>>({
  //     resolver: zodResolver(schema),
  //     defaultValues: { email: '' },
  // })
  return (
    <main className="container mx-auto mt-[80px] max-w-[var(--container-width)] space-y-8 p-8">
      {/* Header Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold">New project</h1>
            {/* Breadcrumbs */}
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/cloud">Cloud</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>New Project</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </div>
      {/* <Form>
                <form style={{ width: 320 }}>
                    <FormField
                        name="email"
                    >
                        <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                                <Input placeholder="name@example.com" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <div style={{ marginTop: 12 }}>
                        <Button type="submit">Submit</Button>
                    </div>
                </form>
            </Form> */}
    </main>
  )
}
