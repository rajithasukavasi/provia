'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronDown, ChevronUp, Download, Eye, FileImage, FileText, Printer, Save, Sparkles, WandSparkles } from 'lucide-react'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { analyzeResume, generateResume, saveResume } from '@/app/actions/resumes'
import { ACCENT_COLORS, SECTION_LABELS, TEMPLATES } from '@/lib/defaults'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ResumeDocument } from '@/components/resume/templates'
import type { Resume, ResumeSectionKey, ResumeTemplate } from '@/lib/types'

function safeName(value: string) { return value.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 90) || 'Provia_Resume' }

export function ResumeWorkflow({ initialResume, photoUrl }: { initialResume: Resume; photoUrl?: string | null }) {
  const router = useRouter()
  const [resume, setResume] = useState(initialResume)
  const [pending, startTransition] = useTransition()
  const [message, setMessage] = useState('')
  const [exporting, setExporting] = useState(false)
  const paperRef = useRef<HTMLDivElement>(null)

  useEffect(() => setResume(initialResume), [initialResume])

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => { setMessage(''); const result = await action(); if (!result.ok) return setMessage(result.error || 'Something went wrong.'); setMessage('Saved.'); router.refresh() })
  }

  const updateContent = (patch: Partial<NonNullable<Resume['content']>>) => {
    if (!resume.content) return
    setResume((r) => ({ ...r, content: { ...r.content!, ...patch } }))
  }

  const moveSection = (key: ResumeSectionKey, direction: -1 | 1) => {
    if (!resume.content) return
    const order = [...resume.content.sectionOrder]
    const index = order.indexOf(key)
    const next = index + direction
    if (index < 0 || next < 0 || next >= order.length) return
    ;[order[index], order[next]] = [order[next], order[index]]
    updateContent({ sectionOrder: order })
  }

  const toggleSection = (key: ResumeSectionKey) => {
    if (!resume.content) return
    const hidden = new Set(resume.content.hiddenSections)
    hidden.has(key) ? hidden.delete(key) : hidden.add(key)
    updateContent({ hiddenSections: [...hidden] })
  }

  const persist = () => {
    if (!resume.content) return
    startTransition(async () => {
      const result = await saveResume(resume.id, { title: resume.title, template: resume.template, content: resume.content! })
      if (!result.ok) return setMessage(result.error)
      setMessage('Resume design saved.')
      router.refresh()
    })
  }

  const exportImage = async (kind: 'jpg' | 'pdf') => {
    if (!paperRef.current || !resume.content) return
    setExporting(true)
    setMessage(`Preparing ${kind.toUpperCase()} export…`)
    try {
      if (document.fonts?.ready) await document.fonts.ready
      const node = paperRef.current.querySelector('.resume-document') as HTMLElement | null
      if (!node) throw new Error('Resume preview is not ready yet.')

      const dataUrl = await toPng(node, {
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#ffffff',
        skipFonts: true,
      })
      const filename = safeName(`${resume.content.personal.fullName || 'Resume'}_${resume.jobTarget.jobTitle || 'Professional'}`)

      if (kind === 'jpg') {
        const img = new Image()
        img.decoding = 'async'
        img.src = dataUrl
        await img.decode()
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not prepare JPG export.')
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        const link = document.createElement('a')
        link.download = `${filename}.jpg`
        link.href = canvas.toDataURL('image/jpeg', 0.94)
        document.body.appendChild(link)
        link.click()
        link.remove()
      } else {
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true })
        pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST')
        pdf.save(`${filename}.pdf`)
      }
      setMessage(`${kind.toUpperCase()} export ready.`)
    } catch (error) {
      console.error('Provia export failed:', error)
      setMessage(error instanceof Error ? error.message : 'Export failed. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  const exportPrint = () => {
    setMessage('Opening print preview…')
    window.setTimeout(() => window.print(), 50)
  }

  const visibleCount = useMemo(() => resume.content?.sectionOrder.filter((s) => !resume.content?.hiddenSections.includes(s)).length ?? 0, [resume.content])

  return <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-6 px-4 py-6 sm:px-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><Button variant="ghost" render={<Link href="/dashboard"/>} nativeButton={false}><ArrowLeft data-icon="inline-start"/>Back</Button><h1 className="mt-2 font-serif text-3xl font-semibold tracking-tight">{resume.jobTarget.jobTitle}</h1><p className="text-muted-foreground">{resume.jobTarget.companyName}</p></div><div className="flex items-center gap-2"><Badge>{resume.status === 'generated' ? 'Ready' : resume.status}</Badge>{resume.content && <Button onClick={persist} disabled={pending}><Save data-icon="inline-start"/>{pending ? 'Saving…' : 'Save design'}</Button>}</div></div>

    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] xl:items-start">
      <aside className="flex flex-col gap-4 xl:sticky xl:top-20">
        <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">1 · Tailor</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Analyze the job, then generate only from evidence already present in the profile.</p><div className="mt-4 grid gap-2"><Button onClick={() => run(() => analyzeResume(resume.id))} disabled={pending}><Sparkles data-icon="inline-start"/>Analyze requirements</Button><Button variant="outline" onClick={() => run(() => generateResume(resume.id, 'ai'))} disabled={pending}><WandSparkles data-icon="inline-start"/>Generate from profile</Button></div>{message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}{resume.analysis && <div className="mt-4 rounded-xl bg-secondary p-4 text-sm"><p className="font-semibold">Strong matches</p><p className="mt-1 text-muted-foreground">{resume.analysis.strongMatches.map((m) => m.skill).join(', ') || 'None yet'}</p><p className="mt-3 font-semibold">Recommended focus</p><ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">{resume.analysis.recommendedFocus.map((i) => <li key={i}>{i}</li>)}</ul></div>}</section>

        {resume.content && <section className="rounded-2xl border bg-card p-5 shadow-sm"><div className="flex items-center justify-between"><div><h2 className="font-semibold">2 · Design</h2><p className="mt-1 text-xs text-muted-foreground">{visibleCount} visible sections</p></div><Eye className="size-4 text-muted-foreground"/></div><div className="mt-4 space-y-2"><label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Template</label>{TEMPLATES.map((t) => <button key={t.id} type="button" onClick={() => setResume((r) => ({ ...r, template: t.id as ResumeTemplate }))} className={`w-full rounded-xl border p-3 text-left transition ${resume.template === t.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:bg-accent'}`}><div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{t.name}</span>{resume.template === t.id && <Check className="size-4 text-primary"/>}</div><p className="mt-1 text-xs text-muted-foreground">{t.description}</p></button>)}</div><div className="mt-5"><label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Accent</label><div className="mt-2 flex flex-wrap gap-2">{ACCENT_COLORS.map((c) => <button key={c.value} title={c.name} type="button" onClick={() => updateContent({ settings: { ...resume.content!.settings, accent: c.value } })} className={`size-8 rounded-full border-2 ${resume.content!.settings.accent === c.value ? 'border-slate-950 ring-2 ring-offset-2' : 'border-white shadow-sm'}`} style={{backgroundColor:c.value}}/>)}</div></div><label className="mt-5 flex cursor-pointer items-center justify-between rounded-xl border p-3"><span><span className="block text-sm font-semibold">Show photo</span><span className="block text-xs text-muted-foreground">Use your profile photo on this resume</span></span><input type="checkbox" checked={resume.content.settings.showPhoto} onChange={(e) => updateContent({ settings: { ...resume.content!.settings, showPhoto: e.target.checked } })} className="size-4 accent-[var(--primary)]"/></label></section>}

        {resume.content && <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">3 · Edit content</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Fine-tune this resume copy without changing your master profile.</p><div className="mt-4 space-y-4"><label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Professional summary</span><textarea value={resume.content.summary} onChange={(e) => updateContent({ summary: e.target.value })} rows={4} className="mt-2 w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-sm leading-5 outline-none focus:border-primary" placeholder="Add a concise, evidence-based summary for this role."/></label>{resume.content.experience.map((item, index) => <label key={item.id} className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Experience · {index + 1} · {item.position || 'Role'}</span><textarea value={item.bullets.join('\n')} onChange={(e) => { const bullets = e.target.value.split('\n').map((v) => v.trim()).filter(Boolean); updateContent({ experience: resume.content!.experience.map((x) => x.id === item.id ? { ...x, bullets } : x) }) }} rows={Math.max(3, Math.min(6, item.bullets.length + 1))} className="mt-2 w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-sm leading-5 outline-none focus:border-primary" placeholder="One achievement or responsibility per line."/></label>)}{resume.content.projects.map((item, index) => <label key={item.id} className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Project · {index + 1} · {item.name || 'Project'}</span><textarea value={item.bullets.join('\n')} onChange={(e) => { const bullets = e.target.value.split('\n').map((v) => v.trim()).filter(Boolean); updateContent({ projects: resume.content!.projects.map((x) => x.id === item.id ? { ...x, bullets } : x) }) }} rows={Math.max(3, Math.min(6, item.bullets.length + 1))} className="mt-2 w-full resize-y rounded-xl border bg-background px-3 py-2.5 text-sm leading-5 outline-none focus:border-primary" placeholder="One project contribution per line."/></label>)}</div></section>}

        {resume.content && <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">4 · Sections</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Reorder or hide sections without changing your master profile.</p><div className="mt-3 space-y-1.5">{resume.content.sectionOrder.map((key, index) => { const hidden = resume.content!.hiddenSections.includes(key); return <div key={key} className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${hidden ? 'opacity-50' : ''}`}><button type="button" title="Move up" disabled={index===0} onClick={() => moveSection(key,-1)} className="rounded p-1 hover:bg-accent disabled:opacity-30"><ChevronUp className="size-3.5"/></button><button type="button" title="Move down" disabled={index===resume.content!.sectionOrder.length-1} onClick={() => moveSection(key,1)} className="rounded p-1 hover:bg-accent disabled:opacity-30"><ChevronDown className="size-3.5"/></button><button type="button" onClick={() => toggleSection(key)} className="flex-1 text-left text-xs font-medium">{SECTION_LABELS[key]}</button><span className="text-[10px] text-muted-foreground">{hidden ? 'Hidden' : 'Shown'}</span></div> })}</div></section>}

        {resume.content && <section className="rounded-2xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">5 · Export</h2><div className="mt-3 grid gap-2"><Button onClick={() => exportImage('pdf')} disabled={exporting}><FileText data-icon="inline-start"/>Download PDF</Button><Button variant="outline" onClick={() => exportImage('jpg')} disabled={exporting}><FileImage data-icon="inline-start"/>Download JPG</Button><Button variant="outline" onClick={exportPrint}><Printer data-icon="inline-start"/>Print / A4</Button></div><p className="mt-3 text-[11px] leading-5 text-muted-foreground">PDF and JPG are generated from the exact A4 preview. Print uses the browser's A4 print settings.</p></section>}
      </aside>

      <section className="min-w-0 overflow-auto rounded-2xl border bg-[#e9e9e7] p-3 shadow-inner sm:p-6"><div ref={paperRef} className="mx-auto w-[794px] shadow-[0_18px_55px_rgba(15,23,42,0.16)]">{resume.content ? <ResumeDocument template={resume.template} content={resume.content} photoUrl={photoUrl}/> : <div className="flex min-h-[1123px] items-center justify-center bg-white text-center text-sm text-neutral-500"><div><p className="font-semibold text-neutral-900">Your resume preview will appear here</p><p className="mt-1">Generate it from your profile to create the first draft.</p></div></div>}</div></section>
    </div>
  </main>
}
