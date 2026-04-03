---
ferret:
  id: api.GET/recommendations
  type: api
  imports:
    - api.GET/search
  shape:
    response:
      type: array
      items:
        type: object
        properties:
          id:
            type: string
          title:
            type: string
          score:
            type: number
        required: [id, title, score]
---

# Recommendations Contract

Imports `api.GET/search` for result shape reuse.
When `auth.jwt` (imported by `api.GET/search`) drifts, this contract is
flagged at depth 2 (transitive impact).
