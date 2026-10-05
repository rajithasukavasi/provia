'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Copy, FileText, MoreHorizontal, Plus, Trash2 } from 'lucide-react'
import { deleteResume, duplicateResume } from '@/app/actions/resumes'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { TEMPLATES } from '@/lib/defaults'
import type { Resume } from '@/lib/types'
import { formatRelative } from '@/lib/utils'

const STATUS: Record<Resume['status'], { label: string; variant: 'secondary' | 'outline' | 'default' }> = {
  draft: { label: 'Draft', variant: 'outline' },
  analyzed: { label: 'Analyzed', variant: 'secondary' },
  generated: { label: 'Ready', variant: 'default' },
}

export function ResumeList({ resumes }: { resumes: Resume[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [toDelete, setToDelete] = useState<Resume | null>(null)

  if (!resumes.length) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <FileText />
          </EmptyMedia>
          <EmptyTitle>No resumes yet</EmptyTitle>
          <EmptyDescription>
            Paste a job description and Provia will match it against your profile and draft a tailored resume.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button render={<Link href="/resume/new" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            Create your first resume
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  function onDuplicate(id: string) {
    startTransition(async () => {
      const res = await duplicateResume(id)
      if (!res.ok) return void toast.error(res.error)
      toast.success('Resume duplicated')
      router.refresh()
    })
  }

  function onDelete() {
    if (!toDelete) return
    const id = toDelete.id
    startTransition(async () => {
      const res = await deleteResume(id)
      setToDelete(null)
      if (!res.ok) return void toast.error(res.error)
      toast.success('Resume deleted')
      router.refresh()
    })
  }

  return (
    <section aria-label="Resumes" className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {resumes.map((r) => {
          const status = STATUS[r.status]
          return (
            <li key={r.id} className="group relative flex flex-col gap-4 rounded-xl border bg-card p-5 transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <Link href={`/resume/${r.id}`} className="truncate font-medium after:absolute after:inset-0">
                    {r.jobTarget.jobTitle || r.title}
                  </Link>
                  <p className="truncate text-sm text-muted-foreground">{r.jobTarget.companyName}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={<Button variant="ghost" size="icon-sm" className="relative z-10" aria-label={`Actions for ${r.title}`} />}
                  >
                    <MoreHorizontal />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem disabled={pending} onClick={() => onDuplicate(r.id)}>
                      <Copy />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive" onClick={() => setToDelete(r)}>
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="mt-auto flex items-center gap-2 text-xs text-muted-foreground">
                <Badge variant={status.variant}>{status.label}</Badge>
                {r.analysis && (
                  <span>{`${r.analysis.strongMatches.length} strong matches`}</span>
                )}
                <span className="ml-auto">
                  {`${TEMPLATES.find((t) => t.id === r.template)?.name ?? ''} · ${formatRelative(r.updatedAt)}`}
                </span>
              </div>
            </li>
          )
        })}
      </ul>

      <AlertDialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this resume?</AlertDialogTitle>
            <AlertDialogDescription>
              {`"${toDelete?.title ?? ''}" will be permanently removed. Your profile is not affected.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete} disabled={pending}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
