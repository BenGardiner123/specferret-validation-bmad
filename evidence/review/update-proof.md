# Update Proof

Scenario: `review-resolution-flow`

Objective:
- prove that `update` preserves blocking behavior and emits downstream update context.

Recorded expectation:
1. Pre-action state contains blocking drift.
2. `ferret review update <target>` (or equivalent guided selection) is executed.
3. Post-action remains blocked where expected, with update context available for downstream consumers.

Evidence requirement:
- before/after command output and CI JSON attached in release evidence log.
