#!/usr/bin/env bash
set -euo pipefail

# Agent mode init scenario — run ferret init with all agent targets.
# This replaces the default 'ferret init --no-hook' step for this branch.
ferret init --agent-targets claude,copilot,gemini
