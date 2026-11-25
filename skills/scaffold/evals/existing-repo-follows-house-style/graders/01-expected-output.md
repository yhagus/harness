---
type: llm
focus: trace
weight: 1
---

The result matches this description: Follows the repo's existing conventions rather than community defaults: creates src/modules/paymentMethods/ (camelCase, like userProfile and orderHistory, not payment-methods), a camelCase service file such as paymentMethodsService.ts, a types file like its siblings have, an index.ts barrel, and a test inside a __tests__/ folder named *.test.ts, mirroring the siblings. Adds the new module to src/modules/index.ts. Does not overwrite or restructure existing files. Treats the checker's uppercase-directory warning as deliberate and says why.
