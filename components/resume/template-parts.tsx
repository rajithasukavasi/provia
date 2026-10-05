import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import type { ResumeContent, ResumeSectionKey } from '@/lib/types'
import { cn, formatDateRange, formatMonth, stripUrl } from '@/lib/utils'

export interface TemplateProps {
  content: ResumeContent
  photoUrl?: string | null
}

export const A4_WIDTH = 794
export const A4_HEIGHT = 1123

export function hasSectionData(
  content: ResumeContent,
  key: ResumeSectionKey,
) {
  if (key === 'summary') return Boolean(content.summary.trim())
  if (key === 'skills') return content.skills.some((g) => g.items.length)
  if (key === 'interests') return content.interests.length > 0
  return content[key].length > 0
}

export function visibleSections(
  content: ResumeContent,
  allowed?: ResumeSectionKey[],
) {
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
    p.email && {
      icon: Mail,
      label: p.email,
      href: `mailto:${p.email}`,
    },

    p.phone && {
      icon: Phone,
      label: p.phone,
      href: `tel:${p.phone.replace(/\s/g, '')}`,
    },

    p.location && {
      icon: MapPin,
      label: p.location,
    },

    p.linkedin && {
      icon: Globe,
      label: stripUrl(p.linkedin),
      href: p.linkedin,
    },

    p.github && {
      icon: Globe,
      label: stripUrl(p.github),
      href: p.github,
    },

    p.portfolio && {
      icon: Globe,
      label: stripUrl(p.portfolio),
      href: p.portfolio,
    },
  ].filter(Boolean) as {
    icon: typeof Mail
    label: string
    href?: string
  }[]
}

interface BodyProps {
  content: ResumeContent
  section: ResumeSectionKey
  compact?: boolean
  muted?: string
  accent?: string
  chips?: boolean
}

export function SectionBody({
  content,
  section,
  compact,
  muted = 'text-slate-500',
  accent = '#243B5A',
  chips,
}: BodyProps) {
  switch (section) {
    case 'summary':
      return (
        <p className="text-[12.2px] leading-[1.58] text-slate-700">
          {content.summary}
        </p>
      )

    case 'skills':
      return (
        <div
          className={cn(
            'flex flex-col',
            compact ? 'gap-3' : 'gap-2.5',
          )}
        >
          {content.skills
            .filter((g) => g.items.length)
            .map((g) => (
              <div key={g.label}>
                <p
                  className={cn(
                    'mb-1 text-[9.5px] font-bold uppercase tracking-[0.14em]',
                    muted,
                  )}
                >
                  {g.label}
                </p>

                {chips ? (
                  <div className="flex flex-wrap gap-1.5">
                    {g.items.map((i) => (
                      <span
                        key={i}
                        className="rounded-md border px-1.5 py-0.5 text-[10.7px] font-medium"
                        style={{
                          borderColor: `${accent}32`,
                          color: accent,
                        }}
                      >
                        {i}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11.7px] leading-[1.5] text-slate-700">
                    {g.items.join(' · ')}
                  </p>
                )}
              </div>
            ))}
        </div>
      )

    case 'experience':
      return (
        <div className="flex flex-col gap-4">
          {content.experience.map((e) => (
            <article key={e.id}>
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="text-[12.8px] font-bold leading-tight text-slate-900">
                  {e.position}

                  {e.company && (
                    <span
                      className="font-medium"
                      style={{ color: accent }}
                    >
                      {' '}
                      · {e.company}
                    </span>
                  )}
                </h4>

                <span
                  className={cn(
                    'shrink-0 text-[10.5px]',
                    muted,
                  )}
                >
                  {formatDateRange(e.startDate, e.endDate)}
                </span>
              </div>

              <Bullets items={e.bullets} />
            </article>
          ))}
        </div>
      )

    case 'projects':
      return (
        <div className="flex flex-col gap-4">
          {content.projects.map((p) => {
            const technologies = Array.isArray(p.technologies)
              ? p.technologies
              : []

            return (
              <article key={p.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <h4 className="text-[12.8px] font-bold leading-tight text-slate-900">
                    {p.name}
                  </h4>

                  {(p.url || p.githubUrl) && (
                    <span
                      className={cn(
                        'max-w-[40%] truncate text-[10px]',
                        muted,
                      )}
                    >
                      {stripUrl(p.url || p.githubUrl)}
                    </span>
                  )}
                </div>

                {technologies.length > 0 && (
                  <p
                    className={cn(
                      'mt-0.5 text-[10.7px] font-medium',
                      muted,
                    )}
                  >
                    {technologies.join(' · ')}
                  </p>
                )}

                <Bullets items={p.bullets} />
              </article>
            )
          })}
        </div>
      )

    case 'education':
      return (
        <div className="flex flex-col gap-3">
          {content.education.map((e) => (
            <article key={e.id}>
              <div className="flex items-baseline justify-between gap-4">
                <h4 className="text-[12.8px] font-bold leading-tight text-slate-900">
                  {e.institution}
                </h4>

                <span
                  className={cn(
                    'shrink-0 text-[10.5px]',
                    muted,
                  )}
                >
                  {formatDateRange(e.startDate, e.endDate)}
                </span>
              </div>

              {(e.degree || e.field) && (
                <p className="text-[11.8px] font-medium text-slate-700">
                  {[e.degree, e.field]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}

              {e.details && (
                <p
                  className={cn(
                    'mt-0.5 text-[11.3px] leading-[1.45]',
                    muted,
                  )}
                >
                  {e.details}
                </p>
              )}
            </article>
          ))}
        </div>
      )

    case 'certifications':
      return (
        <ul className="flex flex-col gap-2 text-[11.3px]">
          {content.certifications.map((c) => (
            <li key={c.id}>
              <span className="font-semibold">
                {c.name}
              </span>

              {c.issuer && (
                <span className={muted}>
                  {' '}
                  · {c.issuer}
                </span>
              )}

              {c.date && (
                <span
                  className={cn('ml-1', muted)}
                >
                  · {formatMonth(c.date)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )

    case 'achievements':
      return (
        <ul className="flex flex-col gap-2 text-[11.3px]">
          {content.achievements.map((a) => (
            <li key={a.id}>
              <span className="font-semibold">
                {a.title}
              </span>

              {a.date && (
                <span
                  className={cn('ml-1', muted)}
                >
                  · {formatMonth(a.date)}
                </span>
              )}

              {a.description && (
                <span
                  className={cn(
                    'block leading-[1.45]',
                    muted,
                  )}
                >
                  {a.description}
                </span>
              )}
            </li>
          ))}
        </ul>
      )

    case 'languages':
      return (
        <ul
          className={cn(
            'text-[10.8px]',
            compact
              ? 'flex flex-col gap-1.5'
              : 'flex flex-wrap gap-x-4 gap-y-1.5',
          )}
        >
          {content.languages.map((l) => (
            <li key={l.id}>
              <span className="font-semibold">
                {l.name}
              </span>

              {l.proficiency && (
                <span className={muted}>
                  {' '}
                  · {l.proficiency}
                </span>
              )}
            </li>
          ))}
        </ul>
      )

    case 'interests':
      return (
        <p className="text-[11.3px] leading-[1.5] text-slate-700">
          {content.interests.join(' · ')}
        </p>
      )
  }
}

function Bullets({ items }: { items: string[] }) {
  return items.length ? (
    <ul className="mt-1.5 flex flex-col gap-0.5 pl-4 text-[11.3px] leading-[1.5] text-slate-700">
      {items.map((b, i) => (
        <li
          key={i}
          className="list-disc marker:text-slate-400"
        >
          {b}
        </li>
      ))}
    </ul>
  ) : null
}

export function Initials({ name }: { name: string }) {
  return (
    <>
      {name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((s) => s[0]?.toUpperCase())
        .join('') || '?'}
    </>
  )
}