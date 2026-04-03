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

Each branch defines expected outcomes in `SCENARIO-MANIFEST.json`:

- `expected.exitCode`
- `expected.driftClass`
- `expected.reviewRequired`

## How Validation Works

The GitHub Actions workflow runs a matrix job over all branches above.
For each branch it:

1. Checks out the branch.
2. Runs `bun vendor/ferret.bundle.js init --no-hook`.
3. Runs `scripts/assert-scenario.sh`.
4. Uploads `artifacts/lint-ci.json`.

`scripts/assert-scenario.sh` enforces that runtime results match `SCENARIO-MANIFEST.json`.

## Run It

- Open **Actions** in GitHub.
- Run **SpecFerret Validation (BMAD)** via `workflow_dispatch`.
- Confirm all matrix entries pass.

## Rules For Changes

When editing any scenario branch:

1. Keep the scenario behavior in sync with that branch purpose.
2. Update `SCENARIO-MANIFEST.json` if expected behavior changes.
3. Ensure `ferret lint --ci` behavior matches manifest assertions.

If a scenario no longer reflects its branch intent, treat that as a regression in validation coverage.
