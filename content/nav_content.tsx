export const NavLinks = [
  {
    ref: "/about",
    name: "About",
    sublinks: [
      { name: "About CaseIT", ref: "/about" },
      { name: "2026 Organizing Committee", ref: "/about/oc" },
      { name: "Get Involved", ref: "/about/Get-Involved" },
    ],
  },
  {
    ref: "/sponsor/Sponsor-Overview",
    name: "Sponsorship",
    sublinks: [
      { name: "Overview", ref: "/sponsor/Sponsor-Overview" },
      {
        name: "Sponsorship Opportunities",
        ref: "/sponsor/Sponsorship-Opportunities",
      },
    ],
  },
  
  {
    ref: "/2026",
    name: "CaseIT 2026",
    sublinks: [
      { name: "Overview", ref: "/2026"},
      { name: "Chair's Welcome", ref: "/2026/chair"},
      { name: "DiscoverIT", ref: "/2026/DiscoverIT/overview"},
      { name: "Sponsor Showcase", ref: "/2026/Sponsor-Showcase"}
    ]
  },
  {
    ref: "/history",
    name: "History",
    sublinks: [
      { name: "Last Year", ref: "/history/recap" },
      { name: "Timeline", ref: "/history" },
      { name: "Media Gallery", ref: "/history/media" },
    ],
  },
  {
    ref: "/contact",
    name: "Contact",
  },
  {
    ref: "https://pivot.caseit.org/",
    name: "PIVOT",
    className:
      "bg-pivotBlue text-white px-6 py-1 rounded-full hover:text-white hover:bg-pivotBlueDark cursor-pointer ",
  },
];
