# Open items (waiting on the owner)

Not code bugs. Do not invent answers; ask.

## Content
- Région Occitanie: real achievements per role (start 09/2025, planned end 2027, same as the master at IAE).
- All copy in `src/content/` and `src/i18n/ui.ts` is draft, taken from the public job posting, the old Wix site and the card.
- Confirm project facts (CDC Habitat, AirBot). The two client screenshots were removed from the repo; they stay in the history of earlier commits (a history rewrite is the owner's call).
- Confirm Astel dates and the end of the CDC Habitat project (assumed Aug 2024).
- Legal page review (hosting details), optional portrait and OG image.
- Choose the site code licence (MIT or AGPL).

## Outside the repo
- 3D card is hidden until the scene is updated (see CLAUDE.md to re-enable). Spline editor only: the text and QR still show the dead `lordelowlow.github.io` URL, and Xref still reads
  "Current". Scene URLs live in `src/data/card.ts`. The live site is `sudosheen.github.io/My-portfolio-website/`.
- Optional repository secret `PUBLIC_PHONE_FR_E164` (E.164, e.g. `+33XXXXXXXXX`) shows the "Reveal FR" button live.
- Old Wix site: https://turnosh.wixsite.com/osheen-turner (unpublish or add a banner after launch).

## Motion redesign (home-motion branch)

## Later
- Custom domain and/or EU static host (build already portable); re-verify the card URL once.
- GitHub Pages is Microsoft-hosted, which the site info page says plainly.
- Save the sub-agent roster as `.claude/agents/` definitions once the test period ends.
