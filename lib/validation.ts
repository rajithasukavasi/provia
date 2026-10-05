import { z } from 'zod'

const text = (max: number) => z.string().trim().max(max)
const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === '' || /^https?:\/\/\S+\.\S+/.test(v), 'Must be a valid URL starting with http:// or https://')
const monthOrEmpty = z
  .string()
  .trim()
  .refine((v) => v === '' || /^\d{4}-\d{2}$/.test(v), 'Use the month picker format (YYYY-MM)')
const id = z.string().min(1).max(64)

export const personalSchema = z.object({
  fullName: text(120).min(1, 'Full name is required'),
  headline: text(160),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address'),
  phone: text(40),
  location: text(120),
  linkedin: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
})

const dated = <T extends z.ZodRawShape>(shape: T) =>
  z
    .object({ ...shape, startDate: monthOrEmpty, endDate: monthOrEmpty })
    .refine((v) => !v.startDate || !v.endDate || v.startDate <= v.endDate, {
      message: 'End date must be after start date',
      path: ['endDate'],
    })

export const educationSchema = dated({
  id,
  institution: text(160).min(1, 'Institution is required'),
  degree: text(160),
  field: text(160),
  description: text(1500),
})

export const experienceSchema = dated({
  id,
  company: text(160).min(1, 'Company is required'),
  position: text(160).min(1, 'Position is required'),
  description: text(3000),
})

export const projectSchema = z.object({
  id,
  name: text(160).min(1, 'Project name is required'),
  description: text(2000),
  technologies: text(400),
  url: optionalUrl,
  githubUrl: optionalUrl,
})

export const certificationSchema = z.object({
  id,
  name: text(200).min(1, 'Certification name is required'),
  issuer: text(160),
  date: monthOrEmpty,
  url: optionalUrl,
})

export const achievementSchema = z.object({
  id,
  title: text(200).min(1, 'Title is required'),
  description: text(1000),
  date: monthOrEmpty,
})

export const interestSchema = z.object({
  id,
  name: text(100).min(1, 'Interest is required'),
  description: text(300),
})

export const languageSchema = z.object({
  id,
  name: text(80).min(1, 'Language is required'),
  proficiency: text(60),
})

const skillList = z.array(text(60).min(1)).max(60)

export const profileSchema = z.object({
  personal: personalSchema,
  education: z.array(educationSchema).max(20),
  experience: z.array(experienceSchema).max(30),
  projects: z.array(projectSchema).max(30),
  skills: z.object({
    technical: skillList,
    soft: skillList,
    tools: skillList,
    languages: skillList,
  }),
  certifications: z.array(certificationSchema).max(30),
  achievements: z.array(achievementSchema).max(30),
  interests: z.array(interestSchema).max(20),
  languages: z.array(languageSchema).max(15),
})

export const jobTargetSchema = z.object({
  companyName: text(160).min(1, 'Company name is required'),
  jobTitle: text(160).min(1, 'Job title is required'),
  jobDescription: text(20000).min(50, 'Paste the job description (at least 50 characters)'),
  requiredSkills: text(2000),
  preferredSkills: text(2000),
  companyWebsite: optionalUrl,
})

const stringArr = (max: number, len = 600) => z.array(z.string().max(len)).max(max)

export const resumeContentSchema = z.object({
  personal: z.object({
    fullName: text(120),
    headline: text(160),
    email: text(200),
    phone: text(40),
    location: text(120),
    linkedin: text(500),
    github: text(500),
    portfolio: text(500),
  }),
  summary: z.string().max(2000),
  skills: z.array(z.object({ label: text(60), items: stringArr(60, 60) })).max(10),
  experience: z
    .array(
      z.object({
        id,
        company: text(160),
        position: text(160),
        startDate: text(20),
        endDate: text(20),
        bullets: stringArr(12),
      }),
    )
    .max(30),
  projects: z
    .array(
      z.object({
        id,
        name: text(160),
        technologies: stringArr(30, 60),
        url: text(500),
        githubUrl: text(500),
        bullets: stringArr(10),
      }),
    )
    .max(30),
  education: z
    .array(
      z.object({
        id,
        institution: text(160),
        degree: text(160),
        field: text(160),
        startDate: text(20),
        endDate: text(20),
        details: z.string().max(1500),
      }),
    )
    .max(20),
  certifications: z.array(certificationSchema.extend({ url: text(500), date: text(20) })).max(30),
  achievements: z.array(achievementSchema.extend({ date: text(20) })).max(30),
  languages: z.array(languageSchema).max(15),
  interests: stringArr(20, 100),
  sectionOrder: z.array(
    z.enum([
      'summary',
      'skills',
      'experience',
      'projects',
      'education',
      'certifications',
      'achievements',
      'languages',
      'interests',
    ]),
  ),
  hiddenSections: z.array(z.string()).max(12),
  settings: z.object({
    accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    showPhoto: z.boolean(),
  }),
  generatedWith: z.enum(['ai', 'direct']),
})

export const templateSchema = z.enum(['modern', 'minimal', 'executive', 'professional', 'creative'])

export function firstError(error: z.ZodError) {
  const issue = error.issues[0]
  if (!issue) return 'Invalid data'
  const path = issue.path.filter((p) => typeof p === 'string').join(' › ')
  return path ? `${path}: ${issue.message}` : issue.message
}
