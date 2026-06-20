# research-compound

Research one compound and output one complete PeptideOS reference-library YAML record. Do not write a prose report.

## Mission

Produce a concise, source-backed compound record that can be saved as:

```text
reference-library/compounds/<compound-id>.yml
```

The record should help users verify labels, organize inventory, understand why people run or track a compound, and know what data is worth logging. It is not a medical protocol and must not recommend use.

## Required YAML Shape

```yaml
schema_version: 1
compound_id: ""
status: draft
updated_at: "YYYY-MM-DD"

identity:
  name: ""
  aliases: []
  non_aliases: []
  compound_type: peptide
  categories: []

forms:
  primary_route: topical
  supported_routes: []
  excluded_routes:
    - route: subq
      reason: ""
  form_factors: []
  verification_fields: []

positioning:
  why_use_this_compound: []
  who_is_tracking_this: []
  common_user_goals: []

evidence:
  tier: identity_only
  mechanism_targets: []
  claim_summary: []
  evidence_gaps: []

risks:
  by_route: {}

tracking:
  useful_logs: []
  inventory_fields: []
  peppi_actions: []

app_profile:
  headline: ""
  summary: ""
  why_people_care: []
  what_to_verify: []
  what_to_track: []
  reality_check: ""

sources:
  - id: ""
    title: ""
    url: ""
    source_type: database
    publisher: ""
    year: 2026

claims:
  - id: ""
    text: ""
    claim_type: identity
    evidence_level: identity
    route_scope: []
    source_ids: []
    confidence: high
    limitations: []
```

## Allowed Values

- `status`: `draft`, `approved`, `rejected`
- `compound_type`: `peptide`, `hormone`, `glp-1`, `small-molecule`, `biologic`, `supplement`, `other`
- `categories`: `healing`, `growth-hormone`, `metabolic`, `longevity`, `cognitive`, `skin-hair`, `immune`, `sleep`, `sexual-reproductive`, `hormone-endocrine`, `custom`
- `routes`: `subq`, `im`, `intranasal`, `oral`, `topical`
- `evidence.tier`: `identity_only`, `preclinical`, `human_limited`, `human_strong`, `approved_label`
- `source_type`: `database`, `publication`, `review`, `label`, `trial`, `regulatory`, `other`
- `claim_type`: `identity`, `mechanism`, `evidence`, `risk`, `formulation`, `interaction`, `regulatory`, `tracking`
- `evidence_level`: `identity`, `preclinical`, `human_limited`, `human_strong`, `approved_label`, `theoretical`, `unknown`
- `confidence`: `high`, `medium`, `low`

## Rules

- Output only YAML.
- Claims should include `source_ids` when a durable source supports them.
- Claims may omit `source_ids` only when `evidence_level` is `unknown`/`theoretical`, or when `confidence` is `low` and `limitations` explicitly explain the uncertainty.
- Do not create dose, frequency, duration, treatment, or personal-use recommendations.
- Do not add contraindications unless they are source-backed.
- Risks must be scoped under the route they apply to.
- Do not discuss unsupported routes except under `forms.excluded_routes`.
- If evidence is thin, say so directly in `evidence_gaps` and `app_profile.reality_check`.
- `app_profile.summary` must be human-friendly and biohacker-forward: explain what people commonly run or track the compound for and the key uncertainty. Do not use dry identity-only copy unless identity is the only defensible claim.
- Prefer short, useful, source-backed fields over filler.
