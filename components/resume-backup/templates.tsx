/* eslint-disable @next/next/no-img-element */
import type { ResumeSectionKey, ResumeTemplate } from '@/lib/types'
import { SECTION_LABELS } from '@/lib/defaults'
import { contactItems, Initials, SectionBody, type TemplateProps, visibleSections } from './template-parts'

const SIDEBAR_SECTIONS: ResumeSectionKey[] = ['skills', 'languages', 'certifications', 'interests']

function Photo({ url, name, className, style }: { url?: string | null; name: string; className: string; style?: React.CSSProperties }) {
  if (url) return <img src={url} alt={`Photo of ${name}`} crossOrigin="anonymous" className={`${className} object-cover`} />
  return (
    <div className={`${className} flex items-center justify-center text-xl font-semibold`} style={style} aria-hidden>
      <Initials name={name} />
    </div>
  )
}

function ModernTemplate({ content, photoUrl }: TemplateProps) {
  const { personal, settings } = content
  const accent = settings.accent
  const side = visibleSections(content, SIDEBAR_SECTIONS)
  const main = visibleSections(content).filter((s) => !SIDEBAR_SECTIONS.includes(s))
  return (
    <div className="flex min-h-full text-[11.5px] text-neutral-800">
      <aside className="flex w-[34%] flex-col gap-6 px-7 py-9 text-white" style={{ backgroundColor: accent }}>
        {settings.showPhoto && (
          <Photo url={photoUrl} name={personal.fullName} className="size-28 rounded-full border-4 border-white/20" style={{ backgroundColor: 'rgba(255,255,255,0.15)' }} />
        )}
        <section className="flex flex-col gap-2">
          <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">Contact</h3>
          <ul className="flex flex-col gap-1.5 break-words">
            {contactItems(content).map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                <c.icon className="mt-0.5 size-3 shrink-0 opacity-70" aria-hidden />
                <span className="min-w-0 break-all">{c.label}</span>
              </li>
            ))}
          </ul>
        </section>
        {side.map((s) => (
          <section key={s} className="flex flex-col gap-2">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/70">{SECTION_LABELS[s]}</h3>
            <SectionBody content={content} section={s} compact muted="text-white/60" />
          </section>
        ))}
      </aside>
      <main className="flex flex-1 flex-col gap-6 px-9 py-9">
        <header className="flex flex-col gap-1">
          <h1 className="text-[28px] font-bold leading-tight tracking-tight text-neutral-900">{personal.fullName}</h1>
          {personal.headline && <p className="text-[13px] font-medium" style={{ color: accent }}>{personal.headline}</p>}
        </header>
        {main.map((s) => (
          <section key={s} className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: accent }}>
              {SECTION_LABELS[s]}
              <span className="h-px flex-1 bg-neutral-200" />
            </h3>
            <SectionBody content={content} section={s} accent={accent} />
          </section>
        ))}
      </main>
    </div>
  )
}

function MinimalTemplate({ content }: TemplateProps) {
  const { personal } = content
  return (
    <div className="flex flex-col gap-6 px-14 py-12 text-[11.5px] text-neutral-800">
      <header className="flex flex-col gap-2">
        <h1 className="text-[30px] font-light tracking-tight text-neutral-900">{personal.fullName}</h1>
        {personal.headline && <p className="text-[13px] text-neutral-500">{personal.headline}</p>}
        <p className="flex flex-wrap gap-x-3 gap-y-1 text-[10.5px] text-neutral-500">
          {contactItems(content).map((c, i) => (
            <span key={c.label}>
              {i > 0 && <span className="mr-3 text-neutral-300">/</span>}
              {c.label}
            </span>
          ))}
        </p>
      </header>
      {visibleSections(content).map((s) => (
        <section key={s} className="grid grid-cols-[110px_1fr] gap-6 border-t border-neutral-200 pt-4">
          <h3 className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400">{SECTION_LABELS[s]}</h3>
          <SectionBody content={content} section={s} />
        </section>
      ))}
    </div>
  )
}

function ExecutiveTemplate({ content }: TemplateProps) {
  const { personal, settings } = content
  return (
    <div className="flex flex-col gap-5 px-14 py-12 font-serif text-[12px] text-neutral-800">
      <header className="flex flex-col items-center gap-1.5 border-b-2 pb-4 text-center" style={{ borderColor: settings.accent }}>
        <h1 className="text-[30px] font-semibold uppercase tracking-[0.08em] text-neutral-900">{personal.fullName}</h1>
        {personal.headline && <p className="text-[13px] italic text-neutral-600">{personal.headline}</p>}
        <p className="flex flex-wrap justify-center gap-x-2 font-sans text-[10.5px] text-neutral-500">
          {contactItems(content).map((c, i) => (
            <span key={c.label}>
              {i > 0 && <span className="mr-2">•</span>}
              {c.label}
            </span>
          ))}
        </p>
      </header>
      {visibleSections(content).map((s) => (
        <section key={s} className="flex flex-col gap-2">
          <h3 className="border-b border-neutral-300 pb-1 text-[12px] font-semibold uppercase tracking-[0.2em]" style={{ color: settings.accent }}>
            {SECTION_LABELS[s]}
          </h3>
          <SectionBody content={content} section={s} />
        </section>
      ))}
    </div>
  )
}

function ProfessionalTemplate({ content, photoUrl }: TemplateProps) {
  const { personal, settings } = content
  return (
    <div className="flex flex-col text-[11.5px] text-neutral-800">
      <header className="flex items-center gap-6 border-b border-neutral-200 px-12 py-9">
        {settings.showPhoto && (
          <Photo url={photoUrl} name={personal.fullName} className="size-20 shrink-0 rounded-lg" style={{ backgroundColor: `${settings.accent}1a`, color: settings.accent }} />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="text-[26px] font-bold tracking-tight text-neutral-900">{personal.fullName}</h1>
          {personal.headline && <p className="text-[13px] font-medium" style={{ color: settings.accent }}>{personal.headline}</p>}
          <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[10.5px] text-neutral-500">
            {contactItems(content).map((c) => (
              <span key={c.label} className="flex items-center gap-1">
                <c.icon className="size-3" aria-hidden />
                {c.label}
              </span>
            ))}
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-5 px-12 py-8">
        {visibleSections(content).map((s) => (
          <section key={s} className="flex flex-col gap-2">
            <h3 className="w-fit rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-white" style={{ backgroundColor: settings.accent }}>
              {SECTION_LABELS[s]}
            </h3>
            <SectionBody content={content} section={s} accent={settings.accent} />
          </section>
        ))}
      </div>
    </div>
  )
}

function CreativeTemplate({ content, photoUrl }: TemplateProps) {
  const { personal, settings } = content
  const accent = settings.accent
  const side = visibleSections(content, SIDEBAR_SECTIONS)
  const main = visibleSections(content).filter((s) => !SIDEBAR_SECTIONS.includes(s))
  return (
    <div className="flex min-h-full flex-col text-[11.5px] text-neutral-800">
      <header className="flex items-end gap-6 px-10 pb-7 pt-10" style={{ backgroundColor: `${accent}12` }}>
        {settings.showPhoto && (
          <Photo url={photoUrl} name={personal.fullName} className="size-24 shrink-0 rounded-2xl" style={{ backgroundColor: accent, color: 'white' }} />
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-[32px] font-extrabold leading-none tracking-tight" style={{ color: accent }}>{personal.fullName}</h1>
          {personal.headline && <p className="text-[13.5px] font-medium text-neutral-700">{personal.headline}</p>}
        </div>
      </header>
      <div className="flex flex-1">
        <main className="flex flex-1 flex-col gap-6 px-10 py-8">
          {main.map((s) => (
            <section key={s} className="flex flex-col gap-2.5">
              <h3 className="text-[15px] font-bold tracking-tight" style={{ color: accent }}>{SECTION_LABELS[s]}</h3>
              <SectionBody content={content} section={s} accent={accent} />
            </section>
          ))}
        </main>
        <aside className="flex w-[32%] flex-col gap-6 border-l border-neutral-200 px-7 py-8">
          <section className="flex flex-col gap-2">
            <h3 className="text-[13px] font-bold" style={{ color: accent }}>Contact</h3>
            <ul className="flex flex-col gap-1.5">
              {contactItems(content).map((c) => (
                <li key={c.label} className="break-all">{c.label}</li>
              ))}
            </ul>
          </section>
          {side.map((s) => (
            <section key={s} className="flex flex-col gap-2">
              <h3 className="text-[13px] font-bold" style={{ color: accent }}>{SECTION_LABELS[s]}</h3>
              <SectionBody content={content} section={s} compact chips={s === 'skills'} accent={accent} />
            </section>
          ))}
        </aside>
      </div>
    </div>
  )
}

const TEMPLATE_COMPONENTS: Record<ResumeTemplate, (props: TemplateProps) => React.JSX.Element> = {
  modern: ModernTemplate,
  minimal: MinimalTemplate,
  executive: ExecutiveTemplate,
  professional: ProfessionalTemplate,
  creative: CreativeTemplate,
}

export function ResumeDocument({
  template,
  ...props
}: TemplateProps & { template: ResumeTemplate }) {
  const Template = TEMPLATE_COMPONENTS[template] ?? ModernTemplate
  return (
    <div className="resume-document flex min-h-[1123px] w-[794px] flex-col bg-white font-sans text-left">
      <Template {...props} />
    </div>
  )
}
