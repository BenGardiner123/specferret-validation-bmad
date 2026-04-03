# SpecFerret Validation Repo (BMAD)

This repository validates SpecFerret behavior against a BMAD-oriented project layout.

## Purpose

It is a GA validation target for candidate builds of `@specferret/cli`.
The workflow asserts expected behavior across a required branch matrix.

## Branch Matrix

- `main`
- `scenario/breaking-required-field`
- `scenario/breaking-type-change`
- `scenario/nonbreaking-optional-add`
- `scenario/transitive-impact-depth`
- `scenario/review-resolution-flow`
- `scenario/code-first-extract`
- `scenario/specferret-opinionated-layout`

Each branch defines expected outcomes in `SCENARIO-MANIFEST.json`.

## Scenario Manifest Assertions

Base expectations:

- `expected.exitCode`
- `expected.driftClass`
- `expected.reviewRequired`

Extended assertions (Sprint 5 hardening):

- `expected.depthAssertions`:
  - `directAtLeast`
  - `transitiveAtLeast`
  - `maxDepthAtLeast`
- `expected.proofArtifacts` (required files for review-flow evidence)
- `expected.extractDeterminism` (runs `ferret extract` twice and asserts identical output hash)

## How Validation Works

The GitHub Actions workflow runs a matrix job over all branches above.
For each branch it:

1. Checks out the branch.
2. Runs `bun vendor/ferret.bundle.js init --no-hook`.
3. Runs `scripts/assert-scenario.sh`.
4. Uploads `artifacts/lint-ci.json` (plus extra artifacts when produced, for example extract determinism logs).

`scripts/assert-scenario.sh` enforces runtime behavior against `SCENARIO-MANIFEST.json`.

## Run It

- Open **Actions** in GitHub.
- Run **SpecFerret Validation (BMAD)** via `workflow_dispatch`.
- Confirm all matrix entries pass.

## Rules For Changes

When editing any scenario branch:

1. Keep scenario fixture behavior aligned to branch intent.
2. Update `SCENARIO-MANIFEST.json` whenever expected behavior changes.
3. Keep proof artifacts present for `scenario/review-resolution-flow`.
4. Keep extraction fixtures deterministic for `scenario/code-first-extract`.

If a scenario no longer reflects its branch intent, treat it as a validation regression.
