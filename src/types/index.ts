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

export interface Profile {
  name: string;
  nickname: string;
  role: string;
  tagline: string;
  bio: string;
  education: Education[];
  certifications: Certification[];
}

export interface SkillCategory {
  category: string;
  items: string[];
}

export interface Project {
  id: string;
  title: string;
  role: string;
  description: string;
  techStack: string[];
  highlights: string[];
  isTopProject: boolean;
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