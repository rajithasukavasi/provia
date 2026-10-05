export interface PersonalInfo {
  fullName: string
  headline: string
  email: string
  phone: string
  location: string
  linkedin: string
  github: string
  portfolio: string
}

export interface Education {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  description: string
}

export interface Experience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  description: string
}

export interface Project {
  id: string
  name: string
  description: string
  technologies: string
  url: string
  githubUrl: string
}

export type SkillCategory = 'technical' | 'soft' | 'tools' | 'languages'

export interface Skill {
  name: string
  category: SkillCategory
}

export interface Skills {
  technical: string[]
  soft: string[]
  tools: string[]
  languages: string[]
}

export interface Certification {
  id: string
  name: string
  issuer: string
  date: string
  url: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  date: string
}

export interface Interest {
  id: string
  name: string
  description: string
}

export interface Language {
  id: string
  name: string
  proficiency: string
}

export interface UserProfileData {
  personal: PersonalInfo
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: Skills
  certifications: Certification[]
  achievements: Achievement[]
  interests: Interest[]
  languages: Language[]
}

export interface UserProfile {
  id: string
  data: UserProfileData
  photoPath: string | null
  photoUrl: string | null
  updatedAt: string
}

export interface JobTarget {
  companyName: string
  jobTitle: string
  jobDescription: string
  requiredSkills: string
  preferredSkills: string
  companyWebsite: string
}

export interface SkillMatch {
  skill: string
  evidence: string
}

export interface JobAnalysis {
  targetRole: string
  strongMatches: SkillMatch[]
  partialMatches: SkillMatch[]
  notFound: string[]
  keywords: string[]
  relevantProjectIds: string[]
  relevantAchievementIds: string[]
  relevantExperienceIds: string[]
  recommendedFocus: string[]
  sectionsToEmphasize: ResumeSectionKey[]
  analyzedAt: string
}

export type ResumeSectionKey =
  | 'summary'
  | 'skills'
  | 'experience'
  | 'projects'
  | 'education'
  | 'certifications'
  | 'achievements'
  | 'languages'
  | 'interests'

export interface ResumeSkillGroup {
  label: string
  items: string[]
}

export interface ResumeExperience {
  id: string
  company: string
  position: string
  startDate: string
  endDate: string
  bullets: string[]
}

export interface ResumeProject {
  id: string
  name: string
  technologies: string[]
  url: string
  githubUrl: string
  bullets: string[]
}

export interface ResumeEducation {
  id: string
  institution: string
  degree: string
  field: string
  startDate: string
  endDate: string
  details: string
}

export interface ResumeSettings {
  accent: string
  showPhoto: boolean
}

export interface ResumeContent {
  personal: PersonalInfo
  summary: string
  skills: ResumeSkillGroup[]
  experience: ResumeExperience[]
  projects: ResumeProject[]
  education: ResumeEducation[]
  certifications: Certification[]
  achievements: Achievement[]
  languages: Language[]
  interests: string[]
  sectionOrder: ResumeSectionKey[]
  hiddenSections: ResumeSectionKey[]
  settings: ResumeSettings
  generatedWith: 'ai' | 'direct'
}

export type ResumeTemplate = 'modern' | 'minimal' | 'executive' | 'professional' | 'creative'

export type ResumeStatus = 'draft' | 'analyzed' | 'generated'

export interface Resume {
  id: string
  userId: string
  title: string
  template: ResumeTemplate
  status: ResumeStatus
  jobTarget: JobTarget
  analysis: JobAnalysis | null
  content: ResumeContent | null
  createdAt: string
  updatedAt: string
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: 'AI_NOT_CONFIGURED' | 'VALIDATION' | 'DATABASE' | 'AI_FAILED' | 'NOT_FOUND' }
