"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import CaseIT_Logo from "@/public/svgs/caseit/CaseIT_Logo";
import Dropdown from "@/components/layout/Dropdown";

const competitionLinks = [
  { label: "CaseIT 2027", href: "/2026" },
  { label: "About CaseIT", href: "/about" },
];

const getInvolvedLinks = [
  { label: "Compete", href: "/compete" },
  { label: "Sponsor", href: "/sponsor" },
  { label: "Join the team", href: "/join" },
];

function ExternalLinkIcon() {
  return (
    <svg aria-hidden="true" className="h-3 w-3" fill="none" viewBox="0 0 12 12">
      <path
        d="M3 9 9 3M4 3h5v5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function PivotLink() {
  return (
    <a
      className="flex items-center gap-2 py-2 transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
      href="https://pivot.caseit.org/"
      rel="noreferrer"
      target="_blank"
    >
      PIVOT
      <ExternalLinkIcon />
    </a>
  );
}

export default function Header() {
  const pathname = usePathname();
  const headerRef = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [lightBackground, setLightBackground] = useState(false);

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY);

    const updateHeader = () => {
      const currentY = Math.max(0, window.scrollY);
      const headerCenter = currentY + (headerRef.current?.offsetHeight ?? 0) / 2;
      const landingGradient = document.querySelector<HTMLElement>("[data-landing-gradient]");
      const footer = document.querySelector("footer");
      const footerTop = footer ? footer.getBoundingClientRect().top + currentY : Infinity;
      const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
      const footerGradientHeight = Math.min(
        80 * rootFontSize,
        Math.max(48 * rootFontSize, 1.2 * window.innerHeight),
      );
      const footerDarkStart = document.body.getBoundingClientRect().bottom + currentY - footerGradientHeight * 0.42;
      const lightStart = landingGradient
        ? landingGradient.getBoundingClientRect().top + currentY +
          (landingGradient.offsetHeight - window.innerHeight) * 0.4
        : window.innerHeight * 1.1;
      const darkStart = landingGradient ? footerTop : footerDarkStart;
      setLightBackground(headerCenter >= lightStart && headerCenter < darkStart);

      if (currentY <= 8) {
        setHidden(false);
        lastY = currentY;
      } else if (Math.abs(currentY - lastY) >= 8) {
        setHidden(currentY > lastY);
        lastY = currentY;
      }
    };

    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    window.addEventListener("resize", updateHeader);
    const observer = new ResizeObserver(updateHeader);
    observer.observe(document.body);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateHeader);
      window.removeEventListener("resize", updateHeader);
    };
  }, [pathname]);

  return (
    <header
      ref={headerRef}
      className={`sticky top-0 z-20 w-full bg-transparent motion-safe:transition-[translate,color] motion-safe:duration-300 motion-safe:ease-out focus-within:translate-y-0 has-[details[open]]:translate-y-0 has-[[aria-expanded=true]]:translate-y-0 ${
        hidden ? "-translate-y-full" : "translate-y-0"
      } ${lightBackground ? "text-black" : "text-white"}`}
    >
      <nav
        aria-label="Main navigation"
        className="site-container flex min-h-20 items-center justify-between gap-8 md:min-h-24"
      >
        <Link
          aria-label="CaseIT home"
          className="block w-28 shrink-0 md:w-32"
          href="/"
        >
          <CaseIT_Logo className="h-auto w-full" />
        </Link>

        <div className="hidden items-center gap-8 text-xl font-normal leading-none tracking-[0em] lg:flex xl:gap-12">
          <Dropdown label="Competition" links={competitionLinks} />
          <Dropdown label="Get Involved" links={getInvolvedLinks} />
          <Link
            className="py-2 transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current"
            href="/contact"
          >
            Contact
          </Link>
          <PivotLink />
        </div>

        <details className="group relative lg:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-full border border-current focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-current [&::-webkit-details-marker]:hidden">
            <span className="sr-only">Open navigation menu</span>
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                d="M4 7h16M4 12h16M4 17h16"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
          </summary>
          <div className="absolute right-0 top-full z-10 mt-4 w-[min(20rem,90vw)] rounded-md border border-white/15 bg-[#1a0909]/95 p-6 text-xl font-normal leading-none tracking-[0em] text-white shadow-xl backdrop-blur-md">
            <div className="flex flex-col gap-3">
              <Dropdown label="Competition" links={competitionLinks} />
              <Dropdown label="Get Involved" links={getInvolvedLinks} />
              <Link className="py-2" href="/contact">
                Contact
              </Link>
              <PivotLink />
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
