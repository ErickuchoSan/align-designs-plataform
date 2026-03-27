'use client';

import { memo } from 'react';

interface SkipLink {
  href: string;
  label: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const DEFAULT_LINKS: SkipLink[] = [
  { href: '#main-content', label: 'Skip to main content' },
  { href: '#navigation', label: 'Skip to navigation' },
];

/**
 * SkipLinks Component (Accessibility)
 *
 * Provides keyboard users a way to skip repetitive navigation
 * and jump directly to main content areas.
 *
 * Usage:
 * 1. Add <SkipLinks /> at the top of your layout
 * 2. Add id="main-content" to your main content area
 * 3. Add id="navigation" to your navigation sidebar
 *
 * Links are visually hidden but appear when focused.
 */
function SkipLinks({ links = DEFAULT_LINKS }: Readonly<SkipLinksProps>) {
  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      <ul className="fixed top-0 left-0 z-[9999] flex gap-2 p-2 bg-white shadow-lg">
        {links.map((link) => (
          <li key={link.href}>
            <a
              href={link.href}
              className="px-4 py-2 bg-[#1B1C1A] text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:ring-offset-2 transition-colors hover:brightness-95"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default memo(SkipLinks);
