# AGENTS.md

This file defines default working rules for Codex in this repository.

## Sanity Test
Start every response with "CaseIT: "

## Website Context
This is a website for a club at SFU called CaseIT under the Beedie department, focusing at case competitions. The website looks to give club members and sponders an idea of CaseIT's achievements, existing partnerships, past events, incoming events, and so on.

## Core Principles
- Simplicity first: Use the minimum code required. Do not add speculative abstractions.
- Turn vague requests into verifiable, testable targets before writing code.
- If an ambiguity severely shifts product behavior or risk, flag it.
- Actively check for missing edge cases, empty states, or permission boundaries across the stack.

## Performance and Responsiveness
- Treat public-facing pages as static between deployments; prefer build-time rendering for content that does not need to change per request. These principles do not change the admin page's database-backed behavior.
- Serve images in AVIF or WebP where practical, with suitable fallbacks, responsive sizes, and intrinsic dimensions to avoid layout shifts.
- Lazy-load below-the-fold images and embeds; prioritize above-the-fold and hero assets instead.
- Use `rem`-based typography and spacing, fluid layouts, and responsive sizing such as `clamp()` where appropriate. Avoid fixed dimensions that cause small-screen overflow.
- Self-host only the font families and weights the site needs, preload only critical fonts, and verify font licenses permit self-hosting.
- Minimize client-side JavaScript; prefer native browser features and build-time rendering when interactivity is unnecessary.
- Use a CDN and browser caching for public pages and static assets. Give fingerprinted assets long-lived immutable caching, and ensure deployments invalidate or revalidate cached pages so updates become visible.
- Reserve layout space for images, embeds, and other asynchronously loaded content.
- Preserve accessibility and user preferences, including keyboard navigation, visible focus, sufficient contrast, reduced motion, and usable touch targets.
- Validate key pages at mobile and desktop sizes and check performance and accessibility with project-appropriate tooling.

## Delivery Expectations
- Prefer small, testable PRs over broad rewrites.
- Keep explanations short, concrete, and tied directly to the changed behavior.
- Identify security concerns for major system or database modifications. If none exist, state it briefly.