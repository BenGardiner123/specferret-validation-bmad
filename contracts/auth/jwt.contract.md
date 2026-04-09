---
ferret:
  id: auth.jwt
  type: api
  shape:
    type: object
    properties:
      id:
        type: string
      email:
        type: string
        format: email
      token:
        type: string
      expiresAt:
        type: string
        format: date-time
    required: [id, email, token, expiresAt]
---

# JWT Contract

Shape sourced from `src/auth/jwt.ts` via `@ferret-contract` source annotation.
No `codeFile` frontmatter field required — annotate in the TypeScript source instead.
