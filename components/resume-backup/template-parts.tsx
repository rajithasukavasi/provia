import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import type { ResumeContent, ResumeSectionKey } from '@/lib/types'
import { cn, formatDateRange, formatMonth, stripUrl } from '@/lib/utils'

export interface TemplateProps {
  content: ResumeContent
  photoUrl?: string | null
}

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123

export function hasSectionData(content: ResumeContent, key: ResumeSectionKey) {
  switch (key) {
    case 'summary':
      return Boolean(content.summary.trim())
    case 'skills':
      return content.skills.some((g) => g.items.length)
    case 'interests':
      return content.interests.length > 0
    default:
      return content[key].length > 0
  }
}

export function visibleSections(content: ResumeContent, allowed?: ResumeSectionKey[]) {
  return content.sectionOrder.filter(
    (key) =>
      !content.hiddenSections.includes(key) &&
      hasSectionData(content, key) &&
      (!allowed || allowed.includes(key)),
  )
}

export function contactItems(content: ResumeContent) {
  const p = content.personal
  return [
    p.email && { icon: Mail, label: p.email, href: `mailto:${p.email}` },
    p.phone && { icon: Phone, label: p.phone, href: `tel:${p.phone.replace(/\s/g, '')}` },
    p.location && { icon: MapPin, label: p.location },
    p.linkedin && { icon: Globe, label: stripUrl(p.linkedin), href: p.linkedin },
    p.github && { icon: Globe, label: stripUrl(p.github), href: p.github },
    p.portfolio && { icon: Globe, label: stripUrl(p.portfolio), href: p.portfolio },
  ].filter(Boolean) as { icon: typeof Mail; label: string; href?: string }[]
}

interface BodyProps {
  content: ResumeContent
  section: ResumeSectionKey
  compact?: boolean
  muted?: string
  accent?: string
  chips?: boolean
}

/** Shared section content; each template supplies its own heading and layout. */
export function SectionBody({ content, section, compact, muted = 'text-neutral-500', accent, chips }: BodyProps) {
  switch (section) {
    case 'summary':
      return <p className="text-pretty leading-relaxed">{content.summary}</p>

    case 'skills':
      return (
        <div className={cn('flex flex-col', compact ? 'gap-2.5' : 'gap-1.5')}>
          {content.skills
            .filter((g) => g.items.length)
            .map((group) =>
              compact || chips ? (
                <div key={group.label} className="flex flex-col gap-1">
                  <p className={cn('text-[10px] font-semibold uppercase tracking-wider', muted)}>{group.label}</p>
                  {chips ? (
                    <div className="flex flex-wrap gap-1">
                      {group.items.map((item) => (
                        <span
                          key={item}
                          className="rounded px-1.5 py-0.5 text-[10.5px]"
                          style={{ backgroundColor: accent ? `${accent}14` : undefined, color: accent }}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="leading-relaxed">{group.items.join(' · ')}</p>
                  )}
                </div>
              ) : (
                <p key={group.label} className="leading-relaxed">
                  <span className="font-semibold">{group.label}: </span>
                  {group.items.join(', ')}
                </p>
              ),
            )}
        </div>
      )

    case 'experience':
      return (
        <div className="flex flex-col gap-3.5">
          {content.experience.map((e) => (
            <article key={e.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-semibold">
                  {e.position}
                  <span className="font-normal" style={{ color: accent }}>
                    {e.company ? ` · ${e.company}` : ''}
                  </span>
                </h4>
                <span className={cn('shrink-0 text-[10.5px]', muted)}>{formatDateRange(e.startDate, e.endDate)}</span>
              </div>
              <Bullets items={e.bullets} />
            </article>
          ))}
        </div>
      )

    case 'projects':
      return (
        <div className="flex flex-col gap-3">
          {content.projects.map((p) => (
            <article key={p.id} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-semibold">{p.name}</h4>
                {(p.url || p.githubUrl) && (
                  <span className={cn('shrink-0 text-[10.5px]', muted)}>{stripUrl(p.url || p.githubUrl)}</span>
                )}
              </div>
              {p.technologies.length > 0 && (
                <p className={cn('text-[10.5px] italic', muted)}>{p.technologies.join(', ')}</p>
              )}
              <Bullets items={p.bullets} />
            </article>
          ))}
        </div>
      )

    case 'education':
      return (
        <div className="flex flex-col gap-2.5">
          {content.education.map((e) => (
            <article key={e.id} className="flex flex-col gap-0.5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="font-semibold">{e.institution}</h4>
                <span className={cn('shrink-0 text-[10.5px]', muted)}>{formatDateRange(e.startDate, e.endDate)}</span>
              </div>
              {(e.degree || e.field) && <p>{[e.degree, e.field].filter(Boolean).join(', ')}</p>}
              {e.details && <p className={cn('leading-relaxed', muted)}>{e.details}</p>}
            </article>
          ))}
        </div>
      )

    case 'certifications':
      return (
        <ul className="flex flex-col gap-1.5">
          {content.certifications.map((c) => (
            <li key={c.id} className={compact ? 'flex flex-col' : 'flex items-baseline justify-between gap-3'}>
              <span>
                <span className="font-medium">{c.name}</span>
                {c.issuer && <span className={muted}>{` — ${c.issuer}`}</span>}
              </span>
              {c.date && <span className={cn('shrink-0 text-[10.5px]', muted)}>{formatMonth(c.date)}</span>}
            </li>
          ))}
        </ul>
      )

    case 'achievements':
      return (
        <ul className="flex flex-col gap-1.5">
          {content.achievements.map((a) => (
            <li key={a.id} className="flex flex-col">
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-medium">{a.title}</span>
                {a.date && <span className={cn('shrink-0 text-[10.5px]', muted)}>{formatMonth(a.date)}</span>}
              </span>
              {a.description && <span className={cn('leading-relaxed', muted)}>{a.description}</span>}
            </li>
          ))}
        </ul>
      )

    case 'languages':
      return (
        <ul className={cn(compact ? 'flex flex-col gap-1' : 'flex flex-wrap gap-x-4 gap-y-1')}>
          {content.languages.map((l) => (
            <li key={l.id}>
              <span className="font-medium">{l.name}</span>
              {l.proficiency && <span className={muted}>{` — ${l.proficiency}`}</span>}
            </li>
          ))}
        </ul>
      )

    case 'interests':
      return <p className="leading-relaxed">{content.interests.join(' · ')}</p>
  }
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="flex flex-col gap-0.5 pl-3.5">
      {items.map((b, i) => (
        <li key={i} className="list-disc leading-relaxed marker:text-neutral-400">
          {b}
        </li>
      ))}
    </ul>
  )
}

export function Initials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
  return <>{initials || '?'}</>
}
