'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ElementType, ReactNode } from 'react'
import { Plus, Save, Trash2, UserRound, GraduationCap, BriefcaseBusiness, FolderKanban, Award, Trophy, Heart, Languages, Wrench, CheckCircle2, Camera, X } from 'lucide-react'
import { saveProfile, saveProfilePhoto } from '@/app/actions/profile'
import type { UserProfileData, Education, Experience, Project, Certification, Achievement, Interest, Language } from '@/lib/types'

const emptyEducation = (): Education => ({ id: crypto.randomUUID(), institution: '', degree: '', field: '', startDate: '', endDate: '', description: '' })
const emptyExperience = (): Experience => ({ id: crypto.randomUUID(), company: '', position: '', startDate: '', endDate: '', description: '' })
const emptyProject = (): Project => ({ id: crypto.randomUUID(), name: '', description: '', technologies: '', url: '', githubUrl: '' })
const emptyCertification = (): Certification => ({ id: crypto.randomUUID(), name: '', issuer: '', date: '', url: '' })
const emptyAchievement = (): Achievement => ({ id: crypto.randomUUID(), title: '', description: '', date: '' })
const emptyInterest = (): Interest => ({ id: crypto.randomUUID(), name: '', description: '' })
const emptyLanguage = (): Language => ({ id: crypto.randomUUID(), name: '', proficiency: '' })

function splitSkills(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean)
}

function joinSkills(value: string[]) {
  return value.join(', ')
}

function Section({ icon: Icon, eyebrow, title, description, children }: { icon: ElementType; eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm sm:p-7">
      <div className="flex gap-4 border-b pb-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-primary"><Icon className="size-5" /></div>
        <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold tracking-tight">{title}</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p></div>
      </div>
      <div className="pt-6">{children}</div>
    </section>
  )
}

function Field({ label, value, onChange, placeholder, type = 'text', hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; hint?: string }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20" />{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</label>
}

function TextArea({ label, value, onChange, placeholder, rows = 4, hint }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; rows?: number; hint?: string }) {
  return <label className="block space-y-2"><span className="text-sm font-medium">{label}</span><textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="w-full resize-y rounded-xl border border-input bg-background px-3.5 py-3 text-sm leading-6 shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/20" />{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</label>
}

function ItemCard({ title, index, onRemove, children }: { title: string; index: number; onRemove: () => void; children: ReactNode }) {
  return <div className="rounded-xl border bg-background/70 p-4 sm:p-5"><div className="mb-5 flex items-center justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{title} {index + 1}</p></div><button type="button" onClick={onRemove} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-3.5" />Remove</button></div>{children}</div>
}

export function ProfileEditor({ initial, initialPhotoUrl }: { initial: UserProfileData; initialPhotoUrl?: string | null }) {
  const [profile, setProfile] = useState<UserProfileData>(() => structuredClone(initial))
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(initialPhotoUrl ?? null)
  const [photoPending, setPhotoPending] = useState(false)

  const completeness = useMemo(() => {
    const checks = [
      !!profile.personal.fullName,
      !!profile.personal.headline,
      !!profile.personal.email,
      !!profile.personal.phone,
      !!profile.personal.location,
      !!profile.personal.linkedin || !!profile.personal.github || !!profile.personal.portfolio,
      profile.skills.technical.length > 0,
      profile.projects.length > 0,
      profile.education.length > 0,
    ]
    return Math.round((checks.filter(Boolean).length / checks.length) * 100)
  }, [profile])

  const updatePersonal = (key: keyof UserProfileData['personal'], value: string) => setProfile((p) => ({ ...p, personal: { ...p.personal, [key]: value } }))
  const updateSkills = (key: keyof UserProfileData['skills'], value: string) => setProfile((p) => ({ ...p, skills: { ...p.skills, [key]: splitSkills(value) } }))

  const save = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await saveProfile(profile)
      setMessage(result.ok ? { type: 'success', text: 'Profile saved successfully.' } : { type: 'error', text: result.error })
      if (result.ok) window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  const readPhoto = (file: File) => {
    if (!file.type.startsWith('image/')) return setMessage({ type: 'error', text: 'Please choose an image file.' })
    const reader = new FileReader()
    reader.onload = () => {
      const source = String(reader.result || '')
      const img = new Image()
      img.onload = async () => {
        const size = 420
        const scale = Math.min(size / img.width, size / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) return setMessage({ type: 'error', text: 'Could not process that image.' })
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.84)
        setPhotoPending(true)
        const result = await saveProfilePhoto(dataUrl)
        setPhotoPending(false)
        if (result.ok) { setPhotoUrl(result.data.url); setMessage({ type: 'success', text: 'Profile photo updated.' }) }
        else setMessage({ type: 'error', text: result.error })
      }
      img.src = source
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = async () => {
    setPhotoPending(true)
    const result = await saveProfilePhoto(null)
    setPhotoPending(false)
    if (result.ok) { setPhotoUrl(null); setMessage({ type: 'success', text: 'Profile photo removed.' }) }
    else setMessage({ type: 'error', text: result.error })
  }

  const updateArray = <K extends keyof UserProfileData>(key: K, id: string, patch: Partial<UserProfileData[K] extends Array<infer T> ? T : never>) => {
    setProfile((p) => ({ ...p, [key]: (p[key] as Array<{ id: string }>).map((item) => item.id === id ? { ...item, ...patch } : item) }))
  }

  const removeArray = (key: keyof UserProfileData, id: string) => setProfile((p) => ({ ...p, [key]: (p[key] as Array<{ id: string }>).filter((item) => item.id !== id) }))
  const addArray = <K extends 'education' | 'experience' | 'projects' | 'certifications' | 'achievements' | 'interests' | 'languages'>(key: K, item: UserProfileData[K][number]) => setProfile((p) => ({ ...p, [key]: [...p[key], item] }))

  return <div className="space-y-6">
    <div className="sticky top-0 z-20 -mx-4 border-b bg-background/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div><div className="flex items-center gap-2"><span className="text-sm font-semibold">Profile completeness</span><span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-primary">{completeness}%</span></div><p className="mt-1 text-xs text-muted-foreground">Keep this profile accurate. Provia uses it as the source of truth for every tailored resume.</p><div className="mt-3 h-1.5 w-full max-w-sm overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completeness}%` }} /></div></div>
        <div className="flex items-center gap-3"><div aria-live="polite" className={`text-sm ${message?.type === 'error' ? 'text-destructive' : 'text-primary'}`}>{message && <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="size-4" />{message.text}</span>}</div><button type="button" onClick={save} disabled={isPending} className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"><Save className="size-4" />{isPending ? 'Saving…' : 'Save profile'}</button></div>
      </div>
    </div>

    <Section icon={UserRound} eyebrow="01 · Identity" title="Personal information" description="The details that appear at the top of your resume and help employers identify you.">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" value={profile.personal.fullName} onChange={(v) => updatePersonal('fullName', v)} placeholder="Your full name" />
        <Field label="Professional headline" value={profile.personal.headline} onChange={(v) => updatePersonal('headline', v)} placeholder="e.g. Computer Science Student & Frontend Developer" />
        <Field label="Email" value={profile.personal.email} onChange={(v) => updatePersonal('email', v)} placeholder="you@example.com" type="email" />
        <Field label="Phone" value={profile.personal.phone} onChange={(v) => updatePersonal('phone', v)} placeholder="+91 …" />
        <Field label="Location" value={profile.personal.location} onChange={(v) => updatePersonal('location', v)} placeholder="City, Country" />
        <Field label="LinkedIn" value={profile.personal.linkedin} onChange={(v) => updatePersonal('linkedin', v)} placeholder="https://linkedin.com/in/…" />
        <Field label="GitHub" value={profile.personal.github} onChange={(v) => updatePersonal('github', v)} placeholder="https://github.com/…" />
        <Field label="Portfolio" value={profile.personal.portfolio} onChange={(v) => updatePersonal('portfolio', v)} placeholder="https://yourportfolio.com" />
      </div>
    </Section>

    <Section icon={Camera} eyebrow="01 · Visual identity" title="Resume photo" description="Add an optional professional headshot. Provia keeps it separate from your written profile data.">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border bg-muted text-xl font-bold text-muted-foreground">
          {photoUrl ? <img src={photoUrl} alt="Profile preview" className="size-full object-cover" /> : <UserRound className="size-9" />}
        </div>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
              <Camera className="size-4" /> {photoPending ? 'Processing…' : 'Choose photo'}
              <input type="file" accept="image/*" className="sr-only" disabled={photoPending} onChange={(e) => { const file = e.target.files?.[0]; if (file) readPhoto(file); e.currentTarget.value = '' }} />
            </label>
            {photoUrl && <button type="button" onClick={removePhoto} disabled={photoPending} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold hover:bg-accent disabled:opacity-60"><X className="size-4" />Remove</button>}
          </div>
          <p className="max-w-xl text-xs leading-5 text-muted-foreground">Use a clear head-and-shoulders photo. The resume template controls whether the photo is shown, so you can turn it off for ATS-first applications.</p>
        </div>
      </div>
    </Section>

    <Section icon={Wrench} eyebrow="02 · Positioning" title="Skills & professional focus" description="Separate skills by type so Provia can match them intelligently to each job description.">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextArea label="Technical skills" value={joinSkills(profile.skills.technical)} onChange={(v) => updateSkills('technical', v)} placeholder="HTML, CSS, JavaScript, React" hint="Separate skills with commas." />
        <TextArea label="Tools & platforms" value={joinSkills(profile.skills.tools)} onChange={(v) => updateSkills('tools', v)} placeholder="Git, GitHub, VS Code, Vercel" />
        <TextArea label="Programming languages" value={joinSkills(profile.skills.languages)} onChange={(v) => updateSkills('languages', v)} placeholder="Python, Java, C++, C" />
        <TextArea label="Soft skills" value={joinSkills(profile.skills.soft)} onChange={(v) => updateSkills('soft', v)} placeholder="Communication, teamwork, problem solving" />
      </div>
    </Section>

    <Section icon={GraduationCap} eyebrow="03 · Education" title="Education" description="Add your degrees, institutions, dates and relevant coursework or academic details.">
      <div className="space-y-4">{profile.education.map((item, i) => <ItemCard key={item.id} title="Education" index={i} onRemove={() => removeArray('education', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Institution" value={item.institution} onChange={(v) => updateArray('education', item.id, { institution: v })} placeholder="University / college" /><Field label="Degree" value={item.degree} onChange={(v) => updateArray('education', item.id, { degree: v })} placeholder="B.Tech" /><Field label="Field of study" value={item.field} onChange={(v) => updateArray('education', item.id, { field: v })} placeholder="Computer Science and Engineering" /><Field label="Start" value={item.startDate} onChange={(v) => updateArray('education', item.id, { startDate: v })} type="month" /><Field label="End" value={item.endDate} onChange={(v) => updateArray('education', item.id, { endDate: v })} type="month" /><div className="sm:col-span-2"><TextArea label="Details / coursework" value={item.description} onChange={(v) => updateArray('education', item.id, { description: v })} placeholder="Relevant coursework, academic highlights, etc." rows={3} /></div></div></ItemCard>)}<button type="button" onClick={() => addArray('education', emptyEducation())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add education</button></div>
    </Section>

    <Section icon={BriefcaseBusiness} eyebrow="04 · Experience" title="Experience" description="Add internships, jobs, freelance work or other relevant professional experience. Only include what is true.">
      <div className="space-y-4">{profile.experience.map((item, i) => <ItemCard key={item.id} title="Experience" index={i} onRemove={() => removeArray('experience', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Company" value={item.company} onChange={(v) => updateArray('experience', item.id, { company: v })} placeholder="Company name" /><Field label="Position" value={item.position} onChange={(v) => updateArray('experience', item.id, { position: v })} placeholder="Frontend Intern" /><Field label="Start" value={item.startDate} onChange={(v) => updateArray('experience', item.id, { startDate: v })} type="month" /><Field label="End" value={item.endDate} onChange={(v) => updateArray('experience', item.id, { endDate: v })} type="month" /><div className="sm:col-span-2"><TextArea label="Responsibilities & achievements" value={item.description} onChange={(v) => updateArray('experience', item.id, { description: v })} placeholder="Describe what you actually did, built or improved." rows={5} /></div></div></ItemCard>)}<button type="button" onClick={() => addArray('experience', emptyExperience())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add experience</button></div>
    </Section>

    <Section icon={FolderKanban} eyebrow="05 · Proof of work" title="Projects" description="Projects are powerful evidence for students and early-career candidates. Add the work you can genuinely discuss in an interview.">
      <div className="space-y-4">{profile.projects.map((item, i) => <ItemCard key={item.id} title="Project" index={i} onRemove={() => removeArray('projects', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Project name" value={item.name} onChange={(v) => updateArray('projects', item.id, { name: v })} placeholder="Project title" /><Field label="Technologies" value={item.technologies} onChange={(v) => updateArray('projects', item.id, { technologies: v })} placeholder="React, TypeScript, Supabase" /><Field label="Live URL" value={item.url} onChange={(v) => updateArray('projects', item.id, { url: v })} placeholder="https://…" /><Field label="GitHub URL" value={item.githubUrl} onChange={(v) => updateArray('projects', item.id, { githubUrl: v })} placeholder="https://github.com/…" /><div className="sm:col-span-2"><TextArea label="Description" value={item.description} onChange={(v) => updateArray('projects', item.id, { description: v })} placeholder="What did you build, how did you build it, and what was the outcome?" rows={4} /></div></div></ItemCard>)}<button type="button" onClick={() => addArray('projects', emptyProject())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add project</button></div>
    </Section>

    <Section icon={Award} eyebrow="06 · Credentials" title="Certifications" description="Add relevant certifications or credentials you want Provia to consider for targeted resumes.">
      <div className="space-y-4">{profile.certifications.map((item, i) => <ItemCard key={item.id} title="Certification" index={i} onRemove={() => removeArray('certifications', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Certification" value={item.name} onChange={(v) => updateArray('certifications', item.id, { name: v })} placeholder="Certification name" /><Field label="Issuer" value={item.issuer} onChange={(v) => updateArray('certifications', item.id, { issuer: v })} placeholder="Issuing organization" /><Field label="Date" value={item.date} onChange={(v) => updateArray('certifications', item.id, { date: v })} type="month" /><Field label="Credential URL" value={item.url} onChange={(v) => updateArray('certifications', item.id, { url: v })} placeholder="https://…" /></div></ItemCard>)}<button type="button" onClick={() => addArray('certifications', emptyCertification())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add certification</button></div>
    </Section>

    <Section icon={Trophy} eyebrow="07 · Achievements" title="Achievements" description="Capture awards, competition results, publications or meaningful accomplishments. Provia will never invent these.">
      <div className="space-y-4">{profile.achievements.map((item, i) => <ItemCard key={item.id} title="Achievement" index={i} onRemove={() => removeArray('achievements', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Title" value={item.title} onChange={(v) => updateArray('achievements', item.id, { title: v })} placeholder="Achievement title" /><Field label="Date" value={item.date} onChange={(v) => updateArray('achievements', item.id, { date: v })} type="month" /><div className="sm:col-span-2"><TextArea label="Description" value={item.description} onChange={(v) => updateArray('achievements', item.id, { description: v })} placeholder="What happened and why is it meaningful?" rows={3} /></div></div></ItemCard>)}<button type="button" onClick={() => addArray('achievements', emptyAchievement())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add achievement</button></div>
    </Section>

    <Section icon={Languages} eyebrow="08 · Communication" title="Languages" description="List languages you can communicate in and your proficiency level.">
      <div className="space-y-4">{profile.languages.map((item, i) => <ItemCard key={item.id} title="Language" index={i} onRemove={() => removeArray('languages', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Language" value={item.name} onChange={(v) => updateArray('languages', item.id, { name: v })} placeholder="English" /><Field label="Proficiency" value={item.proficiency} onChange={(v) => updateArray('languages', item.id, { proficiency: v })} placeholder="Professional / Native / Fluent" /></div></ItemCard>)}<button type="button" onClick={() => addArray('languages', emptyLanguage())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add language</button></div>
    </Section>

    <Section icon={Heart} eyebrow="09 · Personal" title="Interests" description="Optional interests that help your profile feel human while staying professional.">
      <div className="space-y-4">{profile.interests.map((item, i) => <ItemCard key={item.id} title="Interest" index={i} onRemove={() => removeArray('interests', item.id)}><div className="grid gap-4 sm:grid-cols-2"><Field label="Interest" value={item.name} onChange={(v) => updateArray('interests', item.id, { name: v })} placeholder="AI-powered web applications" /><Field label="Short description" value={item.description} onChange={(v) => updateArray('interests', item.id, { description: v })} placeholder="Optional context" /></div></ItemCard>)}<button type="button" onClick={() => addArray('interests', emptyInterest())} className="inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition hover:bg-accent"><Plus className="size-4" />Add interest</button></div>
    </Section>

    <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border bg-card p-5 sm:flex-row"><div><p className="font-semibold">Ready to use this profile?</p><p className="mt-1 text-sm text-muted-foreground">Save your source of truth before creating a new tailored resume.</p></div><button type="button" onClick={save} disabled={isPending} className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"><Save className="size-4" />{isPending ? 'Saving…' : 'Save profile'}</button></div>
  </div>
}
