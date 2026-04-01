import Image from 'next/image'
import Link from 'next/link'

import { Button } from '@/modules/shared/components/ui/button'

export function PowerhouseStack() {
  return (
    <section>
      <div className="mx-auto max-w-[var(--container-width)] px-6 py-20">
        <div className="mb-10 text-center">
          <h2 className="text-foreground mb-3 text-3xl font-bold">
            <strong>Part of the Powerhouse Stack</strong>
          </h2>
          <p className="text-foreground-70 mt-2 text-2xl transition-all duration-500 ease-out">
            Tools that make distributed work simple and private.
          </p>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Left column: Connect (tall) + Achra (short) */}
          <div className="flex flex-col gap-6 md:w-[47%]">
            <div className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-purple-300 bg-white">
              <div className="flex flex-col gap-3 p-6 pb-0">
                <Image
                  src="/images/home/stack-logo-connect.svg"
                  alt="Connect"
                  width={136}
                  height={25}
                  className="h-6 w-auto self-start"
                />
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  Run work the same way every time — clear forms, shared files, private sync, and
                  ready-made templates.
                </p>
              </div>
              <div className="min-h-0 flex-1 px-2 pt-2">
                <Image
                  src="/images/home/stack-connect-app.png"
                  alt="Connect application screenshot"
                  width={600}
                  height={668}
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </div>

            <div className="relative flex h-[260px] flex-col overflow-hidden rounded-2xl border border-purple-300 bg-white">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20"
                style={{ backgroundImage: 'url(/images/home/stack-achra-bg.png)' }}
              />
              <div className="relative z-10 flex flex-col gap-4 p-6">
                <Image
                  src="/images/home/stack-logo-achra.svg"
                  alt="Achra"
                  width={117}
                  height={25}
                  className="h-6 w-auto self-start"
                />
                <p className="text-sm leading-relaxed" style={{ color: '#6b7280' }}>
                  Start your organization.
                  <br />
                  Hire your operator.
                  <br />
                  Find your builder.
                </p>
                <div>
                  <Button
                    asChild
                    size="lg"
                    className="bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Link href="https://achra.com/">Start Building</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Right column: Powerhouse (short) + Renown (tall) */}
          <div className="flex flex-col gap-6 md:w-[53%]">
            <div className="relative flex h-[260px] flex-col justify-between overflow-hidden rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
                style={{ backgroundImage: 'url(/images/home/stack-powerhouse-bg.png)' }}
              />
              <div className="relative z-10 flex flex-col gap-4">
                <Image
                  src="/images/home/stack-logo-powerhouse.svg"
                  alt="Powerhouse"
                  width={216}
                  height={25}
                  className="h-6 w-auto"
                />
                <h3 className="text-xl font-semibold text-white">
                  Learn More About the Powerhouse Stack
                </h3>
              </div>
              <div className="relative z-10">
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="border-white bg-gray-900 text-white hover:bg-gray-800"
                >
                  <Link href="https://powerhouse.io">Visit Powerhouse</Link>
                </Button>
              </div>
            </div>

            <div
              className="flex h-[420px] flex-col overflow-hidden rounded-2xl border border-cyan-200"
              style={{
                background:
                  'linear-gradient(135deg, rgba(230,245,255,1) 0%, rgba(230,255,245,1) 100%)',
              }}
            >
              <div className="flex flex-col gap-3 p-6 pb-0">
                <Image
                  src="/images/home/stack-logo-renown.svg"
                  alt="Renown"
                  width={121}
                  height={32}
                  className="h-7 w-auto self-start"
                />
                <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
                  Verifiable history for every contributor—use it to find talent, grant access, and
                  collaborate with confidence.
                </p>
              </div>
              <div className="min-h-0 flex-1 px-4 pt-2">
                <Image
                  src="/images/home/stack-renown-app.png"
                  alt="Renown application screenshot"
                  width={600}
                  height={712}
                  className="h-full w-full rounded-t-lg object-cover object-top"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
