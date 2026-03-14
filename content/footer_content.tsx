import { svgIcons } from "@/public/svgs/icons";

const competitionLinks = [
  { name: "About CaseIT", ref: "/about" },
  { name: "CaseIT 2026", ref: "/2026" },
];

const sponsorshipLinks = [
  { name: "2026 Sponsors", ref: "/2026/Sponsor-Showcase" },
  { name: "Benefits", ref: "/sponsor/Sponsor-Overview" },
  {
    name: "Sponsorship Opportunities",
    ref: "/sponsor/Sponsorship-Opportunities",
  },
];

const aboutLinks = [
  { name: "Chair's Welcome", ref: "/2026/chair" },
  { name: "CaseIT History", ref: "/history" },
  { name: "Our Team", ref: "/about/oc" },
];

const contactLinks = [
  { name: "Contact Information", ref: "/contact" },
  { name: "FAQ", ref: "/contact" },
];

export const socialLinks = [
  {
    name: svgIcons["instagram"],
    ref: "https://www.instagram.com/caseitsfu/?hl=en",
  },
  { name: svgIcons["facebook"], ref: "https://www.facebook.com/CaseIT/" },
  {
    name: svgIcons["linkedin"],
    ref: "https://www.linkedin.com/company/caseit-mis-case-competition/posts/?feedView=all",
  },
];

export const allLinks = [
  {
    title: "Competition",
    links: competitionLinks,
  },
  {
    title: "Sponsorships",
    links: sponsorshipLinks,
  },
  {
    title: "About",
    links: aboutLinks,
  },
  {
    title: "Contact",
    links: contactLinks,
  },
];
