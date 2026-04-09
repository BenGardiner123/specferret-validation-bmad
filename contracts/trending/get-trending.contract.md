---
ferret:
  id: api.GET/trending
  type: api
  imports:
    - api.GET/recommendations
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
          trendScore:
            type: number
        required: [id, title, trendScore]
---

# Trending Contract

Imports `api.GET/recommendations` for result shape reuse.
When `auth.jwt` (imported transitively via `api.GET/search`) drifts,
this contract is flagged at depth 3 (transitive impact, depth-3 chain).
