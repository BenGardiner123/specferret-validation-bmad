#!/usr/bin/env bash
set -euo pipefail

manifest_path="${1:-SCENARIO-MANIFEST.json}"
cli_cmd="${2:-bun vendor/ferret.bundle.js}"

if ! test -f "$manifest_path"; then
  echo "Missing scenario manifest: $manifest_path" >&2
  exit 1
fi

mkdir -p artifacts

expected_exit_code="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); console.log(String(m.expected?.exitCode ?? ''));" "$manifest_path")"
expected_drift_class="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); console.log(String(m.expected?.driftClass ?? ''));" "$manifest_path")"
expected_review_required="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); console.log(String(Boolean(m.expected?.reviewRequired)));" "$manifest_path")"
expected_depth_direct_at_least="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); const v = m.expected?.depthAssertions?.directAtLeast; console.log(v === undefined ? '' : String(v));" "$manifest_path")"
expected_depth_transitive_at_least="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); const v = m.expected?.depthAssertions?.transitiveAtLeast; console.log(v === undefined ? '' : String(v));" "$manifest_path")"
expected_max_depth_at_least="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); const v = m.expected?.depthAssertions?.maxDepthAtLeast; console.log(v === undefined ? '' : String(v));" "$manifest_path")"
expected_extract_determinism="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); console.log(String(Boolean(m.expected?.extractDeterminism)));" "$manifest_path")"
expected_proof_artifacts="$(bun -e "const m = JSON.parse(await Bun.file(process.argv[1]).text()); const arr = m.expected?.proofArtifacts; console.log(Array.isArray(arr) ? arr.join('\\n') : '');" "$manifest_path")"

if [ -z "$expected_exit_code" ] || [ -z "$expected_drift_class" ]; then
  echo "Manifest must define expected.exitCode and expected.driftClass" >&2
  exit 1
fi

set +e
$cli_cmd lint --ci > artifacts/lint-ci.json
actual_exit_code=$?
set -e

if [ "$actual_exit_code" -ne "$expected_exit_code" ]; then
  echo "Scenario assertion failed: expected exit $expected_exit_code, got $actual_exit_code" >&2
  cat artifacts/lint-ci.json >&2
  exit 1
fi

bun -e "
const fsPath = process.argv[1];
const expectedClass = process.argv[2];
const expectedReview = process.argv[3] === 'true';
const payload = JSON.parse(await Bun.file(fsPath).text());
const breaking = Number(payload.breaking ?? 0);
const nonBreaking = Number(payload.nonBreaking ?? 0);

if (expectedClass === 'clean' && (breaking !== 0 || nonBreaking !== 0)) {
  throw new Error('Expected clean drift class but JSON reports drift.');
}

if (expectedClass === 'breaking' && breaking <= 0) {
  throw new Error('Expected breaking drift class but breaking count is not > 0.');
}

if (expectedClass === 'non-breaking' && (breaking !== 0 || nonBreaking <= 0)) {
  throw new Error('Expected non-breaking drift class but counts do not match.');
}

const reviewRequiredInPayload = Boolean(breaking > 0);
if (expectedReview !== reviewRequiredInPayload) {
  throw new Error('Expected reviewRequired does not match inferred review requirement from breaking count.');
}
" artifacts/lint-ci.json "$expected_drift_class" "$expected_review_required"

if [ -n "$expected_depth_direct_at_least" ] || [ -n "$expected_depth_transitive_at_least" ] || [ -n "$expected_max_depth_at_least" ]; then
  bun -e "
const fsPath = process.argv[1];
const directAtLeastRaw = process.argv[2];
const transitiveAtLeastRaw = process.argv[3];
const maxDepthAtLeastRaw = process.argv[4];
const payload = JSON.parse(await Bun.file(fsPath).text());
const flagged = Array.isArray(payload.flagged) ? payload.flagged : [];
const directCount = flagged.filter((f) => Number(f.depth ?? 0) === 1).length;
const transitiveCount = flagged.filter((f) => Number(f.depth ?? 0) >= 2).length;
const maxDepth = flagged.reduce((acc, f) => Math.max(acc, Number(f.depth ?? 0)), 0);

const directAtLeast = directAtLeastRaw === '' ? null : Number(directAtLeastRaw);
const transitiveAtLeast = transitiveAtLeastRaw === '' ? null : Number(transitiveAtLeastRaw);
const maxDepthAtLeast = maxDepthAtLeastRaw === '' ? null : Number(maxDepthAtLeastRaw);

if (directAtLeast !== null && directCount < directAtLeast) {
  throw new Error('Depth assertion failed: direct depth(1) count ' + directCount + ' < expected ' + directAtLeast);
}

if (transitiveAtLeast !== null && transitiveCount < transitiveAtLeast) {
  throw new Error('Depth assertion failed: transitive depth(2+) count ' + transitiveCount + ' < expected ' + transitiveAtLeast);
}

if (maxDepthAtLeast !== null && maxDepth < maxDepthAtLeast) {
  throw new Error('Depth assertion failed: max depth ' + maxDepth + ' < expected ' + maxDepthAtLeast);
}
" artifacts/lint-ci.json "$expected_depth_direct_at_least" "$expected_depth_transitive_at_least" "$expected_max_depth_at_least"
fi

if [ "$expected_extract_determinism" = "true" ]; then
  $cli_cmd extract > artifacts/extract-run-1.log
  hash_one="$(bun -e "import { createHash } from 'node:crypto'; const files=[...new Bun.Glob('contracts/**/*.contract.md').scanSync('.')].sort(); const h=createHash('sha256'); for (const f of files){ h.update(f+'\\n'); h.update(await Bun.file(f).text()); h.update('\\n'); } console.log(h.digest('hex')); ")"

  $cli_cmd extract > artifacts/extract-run-2.log
  hash_two="$(bun -e "import { createHash } from 'node:crypto'; const files=[...new Bun.Glob('contracts/**/*.contract.md').scanSync('.')].sort(); const h=createHash('sha256'); for (const f of files){ h.update(f+'\\n'); h.update(await Bun.file(f).text()); h.update('\\n'); } console.log(h.digest('hex')); ")"

  printf '{\n  "hashRun1": "%s",\n  "hashRun2": "%s",\n  "identical": %s\n}\n' "$hash_one" "$hash_two" "$([ "$hash_one" = "$hash_two" ] && echo true || echo false)" > artifacts/extract-determinism.json

  if [ "$hash_one" != "$hash_two" ]; then
    echo "Extract determinism assertion failed: hash mismatch between run 1 and run 2" >&2
    exit 1
  fi
fi

if [ -n "$expected_proof_artifacts" ]; then
  while IFS= read -r artifact_path; do
    if [ -z "$artifact_path" ]; then
      continue
    fi
    if ! test -f "$artifact_path"; then
      echo "Missing required proof artifact: $artifact_path" >&2
      exit 1
    fi
  done <<< "$expected_proof_artifacts"
fi

echo "Scenario assertion passed for $manifest_path"
