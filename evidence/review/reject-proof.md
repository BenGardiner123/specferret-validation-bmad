# Reject Proof

Scenario: `review-resolution-flow`

Objective:
- prove that `reject` records intent and does not falsely green the repository state.

Recorded expectation:
1. Pre-action state contains drift requiring review.
2. `ferret review reject <target>` (or equivalent guided selection) is executed.
3. Post-action remains non-green unless independently resolved by contract changes.

Evidence requirement:
- before/after command output and CI JSON attached in release evidence log.
