"use client";

import Link from "next/link";
import { useId, useState } from "react";

type DropdownProps = {
  label: string;
  links: { label: string; href: string }[];
};

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="nav-dropdown-arrow h-3 w-3"
      fill="none"
      viewBox="0 0 12 12"
    >
      <path
        d="m2 4.5 4 4 4-4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function Dropdown({ label, links }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();

  return (
    <div
      className={`nav-dropdown-root relative${isOpen ? " nav-dropdown-open" : ""}`}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;
        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
      onFocus={() => setIsOpen(true)}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button
        aria-controls={menuId}
        aria-expanded={isOpen}
        className="flex cursor-pointer items-center gap-2 py-2 text-xl font-normal leading-none tracking-[0em] transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        {label}
        <ChevronIcon />
      </button>
      <ul
        className="nav-dropdown absolute left-1/2 top-full z-10 flex min-w-max -translate-x-1/2 flex-col items-center gap-0 pt-1 text-center text-base"
        id={menuId}
      >
        {links.map((link) => (
          <li key={link.href}>
            <Link
              className="block px-3 py-1.5 transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
              href={link.href}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
