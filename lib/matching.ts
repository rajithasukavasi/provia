import type { SkillMatch, UserProfileData } from './types'
import { splitList } from './utils'

export function canonical(term: string) {
  const base = term.toLowerCase().replace(/[^a-z0-9+#]/g, '')
  return base.length > 4 && base.endsWith('js') ? base.slice(0, -2) : base
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function mentions(text: string, term: string) {
  if (!text) return false
  const pattern = new RegExp(`(^|[^a-z0-9])${escapeRegex(term.toLowerCase())}($|[^a-z0-9])`, 'i')
  return pattern.test(text.toLowerCase())
}

export function allProfileSkills(profile: UserProfileData) {
  return [
    ...profile.skills.technical,
    ...profile.skills.tools,
    ...profile.skills.soft,
    ...profile.skills.languages,
  ]
}

export function dedupeTerms(terms: string[]) {
  const seen = new Set<string>()
  const result: string[] = []
  for (const term of terms) {
    const key = canonical(term)
    if (!key || seen.has(key)) continue
    seen.add(key)
    result.push(term.trim())
  }
  return result
}

/**
 * Deterministic, explainable matching. A skill is only "strong" when the user
 * listed it themselves; "partial" means it appears elsewhere in their profile.
 */
export function matchSkills(profile: UserProfileData, jobSkills: string[]) {
  const listed = allProfileSkills(profile)
  const listedByKey = new Map(listed.map((s) => [canonical(s), s]))

  const strongMatches: SkillMatch[] = []
  const partialMatches: SkillMatch[] = []
  const notFound: string[] = []

  for (const skill of dedupeTerms(jobSkills)) {
    const key = canonical(skill)

    if (listedByKey.has(key)) {
      strongMatches.push({ skill, evidence: 'Listed in your skills' })
      continue
    }

    const evidence = findEvidence(profile, skill)
    if (evidence) {
      partialMatches.push({ skill, evidence })
      continue
    }

    const related = listed.find((s) => {
      const k = canonical(s)
      return k.length > 2 && key.length > 2 && (k.includes(key) || key.includes(k))
    })
    if (related) {
      partialMatches.push({ skill, evidence: `Related to "${related}" in your skills` })
      continue
    }

    notFound.push(skill)
  }

  return { strongMatches, partialMatches, notFound }
}

function findEvidence(profile: UserProfileData, skill: string): string | null {
  for (const p of profile.projects) {
    const techs = splitList(p.technologies)
    if (techs.some((t) => canonical(t) === canonical(skill)) || mentions(p.description, skill)) {
      return `Mentioned in project "${p.name}"`
    }
  }
  for (const e of profile.experience) {
    if (mentions(e.description, skill) || mentions(e.position, skill)) {
      return `Mentioned in your role at ${e.company}`
    }
  }
  for (const c of profile.certifications) {
    if (mentions(c.name, skill)) return `Covered by certification "${c.name}"`
  }
  for (const ed of profile.education) {
    if (mentions(ed.description, skill) || mentions(ed.field, skill)) {
      return `Mentioned in your education at ${ed.institution}`
    }
  }
  return null
}
