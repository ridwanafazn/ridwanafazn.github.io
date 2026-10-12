export interface Education {
  institution: string;
  degree: string;
  gpa: string;
  highlights: string[];
}

export interface Certification {
  name: string;
  issuer: string;
}

export interface Experience {
  role: string;
  organization: string;
  period: string;
  description?: string;
}

export interface Profile {
  name: string;
  nickname: string;
  role: string;
  tagline: string;
  bio: string;
  currentFocus?: string;
  experience?: Experience[];
  education: Education[];
  certifications: Certification[];
  howIBuild?: HowIBuild;
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface HowIBuildStep {
  step: string;
  detail: string;
}

export interface HowIBuild {
  summary: string;
  steps: HowIBuildStep[];
  why: string;
}

export interface Project {
  id: string;
  title: string;
  role: string;
  description: string;
  longDescription?: string;
  techStack: string[];
  highlights: string[];
  isTopProject: boolean;
  status?: string;
  links?: {
    label: string;
    url: string;
    icon: string;
  }[];
}

export interface Activity {
  id: string;
  type: 'Volunteer' | 'Publication' | 'Leadership';
  title: string;
  organization: string;
  description: string;
  highlights: string[];
}