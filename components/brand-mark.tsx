import Image from 'next/image'
import logoVerde from '@/app/assets/logo-verde.png'
import { cn } from '@/lib/utils'

const sizes = {
  sm: 32,
  md: 48,
} as const

export function BrandMark({
  variant = 'mark',
  size = 'sm',
  className,
}: {
  variant?: 'mark' | 'badge'
  size?: keyof typeof sizes
  className?: string
}) {
  const px = sizes[size]
  const sizeClass = size === 'sm' ? 'size-8' : 'size-12'

  if (variant === 'badge') {
    return (
      <Image
        src="/favicon.ico"
        alt="Banco do Preventório"
        width={px}
        height={px}
        unoptimized
        className={cn(sizeClass, 'shrink-0 rounded-lg', className)}
      />
    )
  }

  return (
    <Image
      src={logoVerde}
      alt="Banco do Preventório"
      width={px}
      height={px}
      className={cn(sizeClass, 'shrink-0', className)}
    />
  )
}
