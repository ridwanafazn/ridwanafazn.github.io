import { HiOutlineAtSymbol } from "react-icons/hi";
import { FaLinkedin } from "react-icons/fa";
import { VscGithubInverted } from "react-icons/vsc";

export interface SidebarLink {
  path: string;
  icon: React.ReactNode;
}

export const sidebarLinks: SidebarLink[] = [
  {
    path: "https://github.com/ridwannadev",
    icon: <VscGithubInverted />,
  },
  {
    path: "mailto:ridwanafzn@gmail.com",
    icon: <HiOutlineAtSymbol />,
  },
  {
    path: "https://www.linkedin.com/in/ridwanafazn/",
    icon: <FaLinkedin />,
  },
];
