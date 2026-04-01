'use client'

import { DotLottieReact } from '@lottiefiles/dotlottie-react'
import { cn } from '@/shared/lib/utils'
import type { ComponentProps } from 'react'


type DotLottieReactProps = ComponentProps<typeof DotLottieReact>

interface DotLottiePlayerProps extends DotLottieReactProps {
  className?: string
}

export function DotLottiePlayer({
  className,
  autoplay = true,
  loop = true,
  ...props
}: DotLottiePlayerProps) {
  return <DotLottieReact className={cn(className)} autoplay={autoplay} loop={loop} {...props} />
}
