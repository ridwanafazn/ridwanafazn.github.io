export interface Project {
  title: string;
  desc: string;
  technologiesUsed: Array<string>;
  image: string;
  projectLink: string;
  gitLink: string;
  alt: string;
  width: number;
  height: number;
}

export const completedProjects: Project[] = [
  {
    title: "This Website",
    desc: "This is my personal portfolio website. I built this website using Next.js (React) and Tailwind CSS.",
    technologiesUsed: ["React", "Next.js", "Tailwind"],
    image: "/projectImgs/website.png",
    projectLink: "",
    gitLink: "https://github.com/ridwannadev/ridwannadev.github.io",
    alt: "This Website",
    width: 250,
    height: 230,
  },
];
