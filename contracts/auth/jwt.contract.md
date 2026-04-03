---
ferret:
  id: auth.jwt
  type: api
  codeFile: src/auth/jwt.ts
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

`codeFile` is set to `src/auth/jwt.ts` to demonstrate code-first extraction.
The shape is identical to the registered baseline — ferret lint exits 0.
