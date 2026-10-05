import 'server-only'

import { GoogleGenAI } from '@google/genai'
import { z } from 'zod'

import { DEFAULT_SECTION_ORDER } from '@/lib/defaults'
import {
  allProfileSkills,
  canonical,
  dedupeTerms,
  matchSkills,
} from '@/lib/matching'

import type {
  JobAnalysis,
  JobTarget,
  ResumeContent,
  ResumeSectionKey,
  UserProfileData,
} from '@/lib/types'

import { descriptionToBullets, splitList } from '@/lib/utils'

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'

const FACT_RULES = `STRICT RULES:
- Never invent information.
- Use only facts present in the candidate profile.
- Never add companies, job titles, dates, technologies, certifications, metrics, numbers, percentages, achievements, responsibilities, or experience that are not in the profile.
- Never claim the candidate has a skill merely because the job asks for it.
- You may improve grammar, clarity, concision, emphasis, ordering, and wording.
- You may connect existing facts to the target role, but you may not change their factual meaning.
- If the profile lacks evidence for a requirement, do not fabricate evidence.
- If something is not supported by the profile, leave it out.`

export class AIConfigurationError extends Error {
  constructor() {
    super(
      'AI generation requires configuration. Set GEMINI_API_KEY to enable analysis and generation.',
    )
    this.name = 'AIConfigurationError'
  }
}

function wrapAIError(error: unknown): never {
  const err = error as {
    name?: string
    message?: string
    statusCode?: number
  }

  console.error('[provia] RAW AI ERROR:', {
    name: err?.name,
    message: err?.message,
    statusCode: err?.statusCode,
  })

  const text = `${err?.name ?? ''} ${err?.message ?? ''}`

  if (
    /Authentication|api key|OIDC|unauthorized|AI_LoadAPIKeyError/i.test(text) ||
    err?.statusCode === 401 ||
    err?.statusCode === 403
  ) {
    throw new AIConfigurationError()
  }

  if (error instanceof z.ZodError) {
    throw new Error(
      `AI returned an unexpected response format: ${error.issues
        .map((issue) => `${issue.path.join('.')} ${issue.message}`)
        .join('; ')}`,
    )
  }

  throw new Error(
    `AI request failed: ${err?.message ?? 'Unknown error'}`,
  )
}

const gemini = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
})

async function generateStructured<T>(
  schema: z.ZodType<T>,
  system: string,
  prompt: string,
): Promise<T> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new AIConfigurationError()
    }

    const response = await gemini.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        systemInstruction: system,
        responseMimeType: 'application/json',
      },
    })

    const text = response.text

    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }

    const parsed = JSON.parse(text)

    return schema.parse(parsed)
  } catch (error) {
    wrapAIError(error)
  }
}

function profileForPrompt(profile: UserProfileData) {
  return JSON.stringify(profile, null, 1)
}

function jobForPrompt(job: JobTarget) {
  return `Company: ${job.companyName}

Role: ${job.jobTitle}

Required skills (user-provided): ${job.requiredSkills || 'n/a'}

Preferred skills (user-provided): ${job.preferredSkills || 'n/a'}

Job description:

${job.jobDescription}`
}

const requirementsSchema = z.object({
  roleTitle: z.string().optional(),

  skills: z
    .array(z.string())
    .describe(
      'Concrete skills, technologies and competencies explicitly requested in the job',
    ),

  keywords: z
    .array(z.string())
    .describe(
      'Important ATS keywords and phrases from the job description',
    ),
})

export type JobRequirements = z.infer<typeof requirementsSchema>

export async function analyzeJobRequirements(
  job: JobTarget,
): Promise<JobRequirements> {
  const result = await generateStructured(
    requirementsSchema,
    `You extract hiring requirements from job descriptions.

Only extract terms that literally appear in or are explicitly required by the posting.

Keep each skill short, usually 1-3 words.

Return at most 25 skills and 15 keywords.

Do not invent technologies or requirements.`,
    jobForPrompt(job),
  )

  return {
    roleTitle: result.roleTitle || job.jobTitle,
    skills: dedupeTerms(result.skills).slice(0, 25),
    keywords: dedupeTerms(result.keywords).slice(0, 15),
  }
}

const strategySchema = z.object({
  relevantExperienceIds: z.array(z.string()).default([]),

  relevantProjectIds: z.array(z.string()).default([]),

  relevantAchievementIds: z.array(z.string()).default([]),

  recommendedFocus: z
    .array(z.string())
    .default([])
    .describe('3-5 short strategy statements based only on profile facts'),

  sectionsToEmphasize: z
    .array(
      z.enum(
        DEFAULT_SECTION_ORDER as [
          ResumeSectionKey,
          ...ResumeSectionKey[],
        ],
      ),
    )
    .default([]),
})

export async function matchProfileToJob(
  profile: UserProfileData,
  job: JobTarget,
  requirements: JobRequirements,
): Promise<JobAnalysis> {
  const jobSkills = [
    ...splitList(job.requiredSkills),
    ...splitList(job.preferredSkills),
    ...requirements.skills,
  ]

  const match = matchSkills(profile, jobSkills)

  const strategy = await generateStructured(
    strategySchema,
    `You are Provia's resume tailoring strategist.

Decide exactly how the candidate should tailor a resume for THIS company and THIS job.

${FACT_RULES}

Important:
- Use the company, job title, required skills, preferred skills and complete job description.
- Different jobs should produce different recommendations.
- Prioritize evidence that best matches this target.
- Return 3-5 useful recommendedFocus statements whenever possible.
- Never recommend unsupported claims.`,
    `TARGET JOB

${jobForPrompt(job)}

COMPUTED MATCH

Strong matches:
${match.strongMatches.map((m) => m.skill).join(', ') || 'none'}

Partial matches:
${match.partialMatches.map((m) => m.skill).join(', ') || 'none'}

Not found:
${match.notFound.join(', ') || 'none'}

CANDIDATE PROFILE

${profileForPrompt(profile)}`,
  )

  const ids = <T extends { id: string }>(
    items: T[],
    picked: string[],
  ) => {
    const valid = new Set(items.map((i) => i.id))

    return [...new Set(picked)].filter((id) => valid.has(id))
  }

  const fallbackFocus = [
    match.strongMatches.length
      ? `Lead with the strongest matching skills: ${match.strongMatches
          .slice(0, 5)
          .map((m) => m.skill)
          .join(', ')}.`
      : 'Lead with the skills most relevant to the target role.',

    profile.projects.length
      ? 'Prioritize projects that provide clear evidence of relevant technical skills.'
      : 'Keep the resume focused on evidence already present in the profile.',

    profile.experience.length
      ? 'Emphasize experience that is most relevant to the target position.'
      : 'Use the strongest available profile evidence to support the target role.',

    requirements.keywords.length
      ? `Use supported job keywords naturally: ${requirements.keywords
          .slice(0, 5)
          .join(', ')}.`
      : 'Keep the resume concise and focused on the target role.',
  ]

  return {
    targetRole: requirements.roleTitle || job.jobTitle,

    ...match,

    keywords: requirements.keywords,

    relevantExperienceIds: ids(
      profile.experience,
      strategy.relevantExperienceIds,
    ),

    relevantProjectIds: ids(
      profile.projects,
      strategy.relevantProjectIds,
    ),

    relevantAchievementIds: ids(
      profile.achievements,
      strategy.relevantAchievementIds,
    ),

    recommendedFocus: (
      strategy.recommendedFocus.length
        ? strategy.recommendedFocus
        : fallbackFocus
    ).slice(0, 5),

    sectionsToEmphasize: [
      ...new Set(
        strategy.sectionsToEmphasize.length
          ? strategy.sectionsToEmphasize
          : DEFAULT_SECTION_ORDER,
      ),
    ],

    analyzedAt: new Date().toISOString(),
  }
}

const generationSchema = z.object({
  headline: z.string().default(''),

  summary: z.string().default(''),

  skillGroups: z
    .array(
      z.object({
        label: z.string().default(''),
        items: z.array(z.string()).default([]),
      }),
    )
    .default([]),

  experience: z
    .array(
      z.object({
        id: z.string(),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),

  projects: z
    .array(
      z.object({
        id: z.string(),
        bullets: z.array(z.string()).default([]),
      }),
    )
    .default([]),

  sectionOrder: z
    .array(
      z.enum(
        DEFAULT_SECTION_ORDER as [
          ResumeSectionKey,
          ...ResumeSectionKey[],
        ],
      ),
    )
    .default([...DEFAULT_SECTION_ORDER]),
})

function relevanceScore(
  text: string,
  targetTerms: string[],
): number {
  const normalizedText = canonical(text)

  if (!normalizedText || !targetTerms.length) {
    return 0
  }

  let score = 0

  for (const term of targetTerms) {
    const normalizedTerm = canonical(term)

    if (!normalizedTerm) continue

    if (normalizedText === normalizedTerm) {
      score += 10
    } else if (normalizedText.includes(normalizedTerm)) {
      score += 6
    } else if (normalizedTerm.includes(normalizedText)) {
      score += 3
    }
  }

  return score
}

function targetTermsFor(
  job: JobTarget,
  analysis: JobAnalysis,
): string[] {
  return dedupeTerms([
    ...splitList(job.requiredSkills),
    ...splitList(job.preferredSkills),
    ...analysis.strongMatches.map((m) => m.skill),
    ...analysis.partialMatches.map((m) => m.skill),
    ...analysis.keywords,
  ])
}

function targetHeadline(
  job: JobTarget,
  fallback: string,
): string {
  const role = job.jobTitle.trim()

  if (!role) {
    return fallback
  }

  const cleanedRole = role
    .replace(/\s+/g, ' ')
    .slice(0, 70)

  return `Computer Science Student & ${cleanedRole}`
}

export async function generateResumeContent(
  profile: UserProfileData,
  job: JobTarget,
  analysis: JobAnalysis,
): Promise<ResumeContent> {
  const targetTerms = targetTermsFor(job, analysis)

  const result = await generateStructured(
    generationSchema,

    `You are Provia's senior resume writer.

Create a genuinely different resume for THIS SPECIFIC TARGET.

${FACT_RULES}

TAILORING REQUIREMENTS:

1. The company and job description must influence the result.
2. Create a target-specific headline.
3. Create a target-specific professional summary.
4. Prioritize skills that match the target.
5. Prioritize the most relevant experience.
6. Prioritize the most relevant projects.
7. Rewrite bullets to emphasize existing evidence relevant to the target.
8. Change ordering when the target changes.
9. Do not simply copy the candidate's profile.
10. Do not generate the same resume for every company.
11. If the target is Java, prioritize genuine Java/OOP/SQL/API evidence.
12. If the target is frontend, prioritize genuine HTML/CSS/React/TypeScript/UI evidence.
13. If the target changes, the emphasis must change.
14. Never invent missing skills or experience.
15. Use job keywords naturally only when supported by the profile.
16. Return concise ATS-friendly content.
17. Maximum 4 bullets per experience/project.
18. Select only the strongest relevant experience and project items.
19. Always return every required top-level field.
20. For every experience and project, always return the exact profile id and a bullets array.
21. Never omit fields. Use empty arrays or empty strings when appropriate.`,

    `TARGET COMPANY

${job.companyName}

TARGET ROLE

${job.jobTitle}

FULL JOB TARGET

${jobForPrompt(job)}

TARGET SKILLS

${targetTerms.join(', ') || 'none'}

ANALYSIS

Strong matches:

${analysis.strongMatches.map((m) => m.skill).join(', ') || 'none'}

Partial matches:

${analysis.partialMatches.map((m) => m.skill).join(', ') || 'none'}

Keywords:

${analysis.keywords.join(', ') || 'none'}

Recommended focus:

${analysis.recommendedFocus.join(' | ') || 'none'}

Relevant experience IDs:

${analysis.relevantExperienceIds.join(', ') || 'none'}

Relevant project IDs:

${analysis.relevantProjectIds.join(', ') || 'none'}

CANDIDATE PROFILE

${profileForPrompt(profile)}

Create the resume specifically for this target.`,
  )

  const base = buildDirectContent(profile)

  const profileSkillGroups = [
    {
      label: 'Technical',
      items: profile.skills.technical,
    },
    {
      label: 'Tools',
      items: profile.skills.tools,
    },
    {
      label: 'Soft Skills',
      items: profile.skills.soft,
    },
  ].filter((g) => g.items.length)

  const rankedSkillGroups = profileSkillGroups
    .map((group) => ({
      label: group.label,
      items: [...group.items].sort(
        (a, b) =>
          relevanceScore(b, targetTerms) -
          relevanceScore(a, targetTerms),
      ),
    }))
    .map((group) => ({
      ...group,
      items: group.items.slice(0, 8),
    }))
    .filter((group) => group.items.length)

  const aiSkillGroups = result.skillGroups
    .map((group) => ({
      label: group.label.trim(),

      items: dedupeTerms(group.items)
        .map((item) => {
          const found = allProfileSkills(profile).find(
            (profileSkill) =>
              canonical(profileSkill) === canonical(item),
          )

          return found
        })
        .filter((item): item is string => Boolean(item)),
    }))
    .filter((group) => group.label && group.items.length)

  const rankedAllSkills = dedupeTerms(
    rankedSkillGroups.flatMap((group) => group.items),
  )

  const aiRelevantSkills = dedupeTerms(
    aiSkillGroups.flatMap((group) => group.items),
  )

  const finalSkillOrder = [
    ...aiRelevantSkills.sort(
      (a, b) =>
        relevanceScore(b, targetTerms) -
        relevanceScore(a, targetTerms),
    ),

    ...rankedAllSkills,
  ]

  const uniqueFinalSkills = dedupeTerms(finalSkillOrder)

  const finalSkills = [
    ...uniqueFinalSkills.filter(
      (skill) => relevanceScore(skill, targetTerms) > 0,
    ),

    ...uniqueFinalSkills.filter(
      (skill) => relevanceScore(skill, targetTerms) === 0,
    ),
  ].slice(0, 16)

  const skillGroups = [
    {
      label: 'Technical',

      items: finalSkills.filter((skill) =>
        profile.skills.technical.some(
          (candidateSkill) =>
            canonical(candidateSkill) === canonical(skill),
        ),
      ),
    },

    {
      label: 'Tools',

      items: finalSkills.filter((skill) =>
        profile.skills.tools.some(
          (candidateSkill) =>
            canonical(candidateSkill) === canonical(skill),
        ),
      ),
    },

    {
      label: 'Soft Skills',

      items: finalSkills.filter((skill) =>
        profile.skills.soft.some(
          (candidateSkill) =>
            canonical(candidateSkill) === canonical(skill),
        ),
      ),
    },
  ].filter((group) => group.items.length)

  const bulletsFor = (
    list: { id: string; bullets: string[] }[],
  ) =>
    new Map(
      list.map((item) => [
        item.id,

        item.bullets
          .map((bullet) => bullet.trim())
          .filter(Boolean)
          .slice(0, 4),
      ]),
    )

  const expBullets = bulletsFor(result.experience)
  const projectBullets = bulletsFor(result.projects)

  const experienceRank = new Map(
    analysis.relevantExperienceIds.map((id, index) => [
      id,
      index,
    ]),
  )

  const projectRank = new Map(
    analysis.relevantProjectIds.map((id, index) => [
      id,
      index,
    ]),
  )

  const rankedExperience = [...profile.experience]
    .map((item) => ({
      item,

      score:
        relevanceScore(
          `${item.position} ${item.company} ${item.description}`,
          targetTerms,
        ) +
        (experienceRank.has(item.id)
          ? 100 - (experienceRank.get(item.id) ?? 99)
          : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(3, profile.experience.length))

  const rankedProjects = [...profile.projects]
    .map((item) => ({
      item,

      score:
        relevanceScore(
          `${item.name} ${item.technologies} ${item.description}`,
          targetTerms,
        ) +
        (projectRank.has(item.id)
          ? 100 - (projectRank.get(item.id) ?? 99)
          : 0),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(4, profile.projects.length))

  const selectedExperience = rankedExperience.map(
    (entry) => entry.item,
  )

  const selectedProjects = rankedProjects.map(
    (entry) => entry.item,
  )

  const aiExperienceOrder = new Map(
    result.experience.map((item, index) => [
      item.id,
      index,
    ]),
  )

  const aiProjectOrder = new Map(
    result.projects.map((item, index) => [
      item.id,
      index,
    ]),
  )

  selectedExperience.sort(
    (a, b) =>
      (aiExperienceOrder.get(a.id) ?? 999) -
      (aiExperienceOrder.get(b.id) ?? 999),
  )

  selectedProjects.sort(
    (a, b) =>
      (aiProjectOrder.get(a.id) ?? 999) -
      (aiProjectOrder.get(b.id) ?? 999),
  )

  const sectionOrder = [
    ...new Set([
      'summary',
      ...analysis.sectionsToEmphasize,
      ...result.sectionOrder,
      ...DEFAULT_SECTION_ORDER,
    ]),
  ] as ResumeSectionKey[]

  return {
    ...base,

    personal: {
      ...base.personal,

      headline: targetHeadline(
        job,
        result.headline.trim() || base.personal.headline,
      ),
    },

    summary:
      result.summary.trim() ||
      `Computer Science student targeting ${job.jobTitle}.`,

    skills:
      skillGroups.length > 0
        ? skillGroups
        : base.skills,

    experience: selectedExperience.map((experience) => ({
      ...experience,

      bullets:
        expBullets.get(experience.id)?.length
          ? expBullets.get(experience.id)!
          : descriptionToBullets(
              experience.description,
            ),
    })),

    projects: selectedProjects.map((project) => ({
      ...project,

      // IMPORTANT: template-parts.tsx expects this to be an array.
      technologies: splitList(project.technologies),

      bullets:
        projectBullets.get(project.id)?.length
          ? projectBullets.get(project.id)!
          : descriptionToBullets(
              project.description,
            ),
    })),

    achievements: [...base.achievements].sort(
      (a, b) =>
        (analysis.relevantAchievementIds.indexOf(a.id) === -1
          ? 999
          : analysis.relevantAchievementIds.indexOf(a.id)) -
        (analysis.relevantAchievementIds.indexOf(b.id) === -1
          ? 999
          : analysis.relevantAchievementIds.indexOf(b.id)),
    ),

    sectionOrder,

    generatedWith: 'ai',
  }
}

const improveSchema = z.object({
  text: z.string(),
})

export async function improveResumeContent(
  kind: 'summary' | 'bullet',
  text: string,
  context: {
    jobTitle: string
    companyName: string
  },
): Promise<string> {
  const result = await generateStructured(
    improveSchema,

    `You polish resume text.

${FACT_RULES}

Return a single improved ${
      kind === 'summary'
        ? 'professional summary of 2-4 sentences'
        : 'resume bullet point starting with an action verb, without a leading bullet symbol'
    }.

Keep every existing fact.

Do not add new numbers, technologies, responsibilities, achievements, or claims.`,

    `Target role: ${context.jobTitle}

Target company: ${context.companyName}

Original text:

${text}`,
  )

  return result.text.trim()
}

/**
 * Builds a resume directly from the profile without AI rewriting.
 */
export function buildDirectContent(
  profile: UserProfileData,
): ResumeContent {
  const skillGroups = [
    {
      label: 'Technical',
      items: profile.skills.technical,
    },

    {
      label: 'Tools',
      items: profile.skills.tools,
    },

    {
      label: 'Soft Skills',
      items: profile.skills.soft,
    },
  ].filter((g) => g.items.length)

  return {
    personal: { ...profile.personal },

    summary: '',

    skills: skillGroups,

    experience: profile.experience.map((e) => ({
      id: e.id,
      company: e.company,
      position: e.position,
      startDate: e.startDate,
      endDate: e.endDate,
      bullets: descriptionToBullets(e.description),
    })),

    projects: profile.projects.map((p) => ({
      id: p.id,
      name: p.name,

      technologies: splitList(p.technologies),

      url: p.url,
      githubUrl: p.githubUrl,

      bullets: descriptionToBullets(p.description),
    })),

    education: profile.education.map((e) => ({
      id: e.id,
      institution: e.institution,
      degree: e.degree,
      field: e.field,
      startDate: e.startDate,
      endDate: e.endDate,
      details: e.description,
    })),

    certifications: profile.certifications.map((c) => ({
      ...c,
    })),

    achievements: profile.achievements.map((a) => ({
      ...a,
    })),

    languages: [
      ...profile.languages.map((l) => ({
        ...l,
      })),

      ...profile.skills.languages
        .filter(
          (name) =>
            !profile.languages.some(
              (l) =>
                canonical(l.name) === canonical(name),
            ),
        )
        .map((name) => ({
          id: `skill-${canonical(name)}`,
          name,
          proficiency: '',
        })),
    ],

    interests: profile.interests.map((i) => i.name),

    sectionOrder: [...DEFAULT_SECTION_ORDER],

    hiddenSections: [],

    settings: {
      accent: '#1f6f6b',
      showPhoto: true,
    },

    generatedWith: 'direct',
  }
}