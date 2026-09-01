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

## Delivery Expectations
- Prefer small, testable PRs over broad rewrites.
- Keep explanations short, concrete, and tied directly to the changed behavior.
- Identify security concerns for major system or database modifications. If none exist, state it briefly.