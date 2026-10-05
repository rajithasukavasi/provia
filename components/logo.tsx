import Link from 'next/link'
import { cn } from '@/lib/utils'

export function Logo({ href = '/', className }: { href?: string; className?: string }) {
  return (
    <Link href={href} className={cn('flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span className="flex size-7 items-center justify-center rounded-md bg-primary font-serif text-base text-primary-foreground" aria-hidden>
        P
      </span>
      <span className="text-lg">Provia</span>
    </Link>
  )
}
