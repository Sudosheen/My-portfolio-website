# Operator model, sub-agents and ticket intake

Status: the roster below is being tested and is **not yet saved** as `.claude/agents/` definitions. Until it is,
spawn agents with an explicit model and effort.

## Operator
Sonnet, medium effort (high for a big ticket batch or a review touching the invariants in CLAUDE.md). The operator
triages tickets, picks a role, writes self-contained briefs, reviews returned work, runs the gates, and owns all git
actions. Small tickets (a few edits) are done inline: a spawned agent starts cold and re-reads the project.
State the route in one line each time, e.g. "Routed to sonnet-fixer, medium: CSS fix, check dark mode."

## Roster
| Role | Model, effort | Used for |
|---|---|---|
| opus-diagnostician | Opus, high | unclear bugs, design decisions, anything touching the invariants |
| opus-auditor | Opus, xhigh | `/card/` and CSP, security review, pre-commit review of large changes |
| sonnet-triage | Sonnet, medium | turning tickets into verified work items |
| sonnet-fixer | Sonnet, medium | CSS and component fixes (light/dark, EN/FR, 375/1280 px) |
| sonnet-qa | Sonnet, medium | read-only verification sweeps; one at a time (single browser pane) |
| haiku-copy | Haiku, low | exact-string EN/FR edits; tests catch key parity and NBSP lapses |
| haiku-scout | Haiku, low | read-only lookups and inventories |

Rules: at most 3 agents at once; no two editing the same file (stylesheets and `ui.ts` are hot spots); escalate one
tier after two failed gate runs or when an invariant is touched; the operator runs the final gates and all git.

## Ticket intake
Tickets are written by a screenshot-only agent that cannot read the code. They describe what is visible; the
operator verifies against the source and adds triage notes. Tickets should not prescribe implementation.

Ticket fields (agent): Title, Type, Severity (guess), Page and section, Locale, Theme and width as visible,
Screenshot name, **Observed**, **Desired**, Acceptance criteria (visible, checkable outcomes), Questions.
Use "appears to" for inferences; say "cannot tell from a still image" for hover/focus; no tool citations.

Triage notes (operator): verified current behaviour with `file:line`, files to change, side effects on shared
code or data, invariants touched, verification commands, decisions needed from the owner.
