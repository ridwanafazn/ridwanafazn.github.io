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

export interface Stat {
  label: string;
  value: string;
}

export interface CurrentFocus {
  title: string;
  description: string;
}

export interface Profile {
  name: string;
  nickname: string;
  role: string;
  tagline: string;
  bio: string;
  cvUrl?: string;
  currentFocus?: CurrentFocus;
  stats?: Stat[];
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
  coverImage?: string;
  /** Gambar kecil untuk hover preview di ledger (w_480). */
  previewImage?: string;
  /** Kartu share 1200×630 (cover atau gambar galeri pertama). */
  ogImage?: string;
  gallery?: {
    url: string;
    srcset?: string;
    /** Dimensi asli aset (dipakai galeri agar lebar kartu = rasio asli). */
    width?: number;
    height?: number;
    caption?: string;
    alt?: string;
    name?: string;
  }[];
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