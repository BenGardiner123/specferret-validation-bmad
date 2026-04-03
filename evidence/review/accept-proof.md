# Accept Proof

Scenario: `review-resolution-flow`

Objective:
- prove that `accept` clears the reviewed drift event and returns the scenario to clean state.

Recorded expectation:
1. Pre-action state contains drift requiring review.
2. `ferret review accept <target>` (or equivalent guided selection) is executed.
3. Post-action `ferret lint --ci` is clean (`exitCode: 0`, `breaking: 0`, `nonBreaking: 0`).

Evidence requirement:
- before/after command output attached in CI artifacts or release evidence log.
