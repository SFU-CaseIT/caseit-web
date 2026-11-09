import Link from "next/link";
import CaseIT_Logo from "@/public/svgs/caseit/CaseIT_Logo";

const footerGroups = [
  {
    title: "Connect",
    links: [
      { label: "Contact", href: "/contact" },
      {
        label: "Instagram",
        href: "https://www.instagram.com/caseitsfu/?hl=en",
        external: true,
      },
      {
        label: "LinkedIn",
        href: "https://www.linkedin.com/company/caseit-mis-case-competition/posts/?feedView=all",
        external: true,
      },
    ],
  },
  {
    title: "Get Involved",
    links: [
      { label: "Compete", href: "/compete" },
      { label: "Sponsor", href: "/sponsor" },
      { label: "Join the team", href: "/join" },
    ],
  },
  {
    title: "Competition",
    links: [
      { label: "Home", href: "/" },
      { label: "CaseIT 2027", href: "/2026" },
      { label: "About CaseIT", href: "/about" },
    ],
  },
  {
    title: "Other",
    links: [
      { label: "PIVOT", href: "https://pivot.caseit.org/", external: true },
      {
        label: "Privacy Policy",
        href: "https://www.sfu.ca/contact/terms-conditions/privacy.html",
        external: true,
      },
      {
        label: "Land Acknowledgement",
        href: "https://www.sfu.ca/communicators-toolkit/brand/guidelines/writing/editorial-style-guide/language-grammar/territorial-acknowledgements.html",
        external: true,
      },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-transparent py-10 text-white md:py-12">
      <div className="site-container">
        <div className="mb-10 flex items-end gap-4 md:mb-12">
          <Link aria-label="CaseIT home" className="block w-36 md:w-44" href="/">
            <CaseIT_Logo className="h-auto w-full text-white" />
          </Link>
          <span className="pb-1 text-xs">© 2027</span>
        </div>

        <nav
          aria-label="Footer navigation"
          className="grid grid-cols-2 gap-x-6 gap-y-9 md:grid-cols-4 md:gap-8"
        >
          {footerGroups.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 text-xl font-bold md:mb-4 md:text-2xl">
                {group.title}
              </h2>
              <ul className="flex flex-col gap-2 text-sm md:text-base">
                {group.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        className="transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        href={link.href}
                        rel="noreferrer"
                        target="_blank"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        className="transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
                        href={link.href}
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </nav>
        <p className="mt-10 border-t border-white/20 pt-4 text-xs text-white/70">
          DIN and DIN Cond Medium fonts by{" "}
          <a
            className="underline underline-offset-2 transition-opacity hover:opacity-70"
            href="https://www.onlinewebfonts.com/"
            rel="noreferrer"
            target="_blank"
          >
            OnlineWebFonts
          </a>
        </p>
      </div>
    </footer>
  );
}
