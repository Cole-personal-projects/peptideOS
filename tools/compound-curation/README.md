# Compound Curation Workflow

PeptideOS reference compounds move through this pipeline:

candidate -> sourced facts -> normalized draft -> safety review -> validation -> human approval -> reviewed entry

This workflow is for bundled stock-library data. User-created compounds belong in local app storage, not this folder.

## Rules

- No generated facts ship without human review.
- Do not copy third-party database descriptions.
- Do not add medical instructions, treatment guidance, or dose recommendations.
- Do not promote a compound to `reviewed` unless citations/source notes are present.
- Keep source facts separate from app copy so reviewers can audit what changed.

## Folders

- `candidates/`: lightweight backlog files with names, aliases, category guesses, and source hints.
- `sourced/`: cited source facts collected from PubChem, DailyMed, UniProt, ChEMBL, PubMed, or other reviewable sources.
- `drafts/`: normalized TypeScript entries that compile against `ReferenceCompound` but are not shipped in the app index.
- `reviewed/`: human-approved curation notes or promotion records. App-shipped entries live in `lib/reference-compounds/entries/`.

## Agent Checklist

1. Create or update a candidate file.
2. Collect source facts with citations and URLs.
3. Normalize into a draft reference entry.
4. Run a safety review for recommendation language.
5. Run `pnpm compound:validate`.
6. Ask for human approval before adding the entry to `lib/reference-compounds/index.ts`.

## Review Checklist

- Compound type and category fit the source facts.
- Default route and unit are conservative and source-backed.
- Presets are labeled for logging/reference only.
- Citations use HTTPS URLs and identify the source.
- Copy is original, concise, and research/tracking oriented.
