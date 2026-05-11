---
name: typescript-component-style
description: Use when writing or modifying TypeScript React components - enforces const arrow function declarations with named exports instead of default export functions
---

# TypeScript Component Style

## Core Rule

Always define React components as `const` arrow functions with named exports. Never use `export default function`.

## Pattern

```tsx
// ❌ Wrong
export default function MyComponent({ foo }: Props) {
  return <div>{foo}</div>;
}

// ✅ Correct
export const MyComponent = ({ foo }: Props) => {
  return <div>{foo}</div>;
};
```

## Named Imports

Because components use named exports, always import them explicitly:

```tsx
// ❌ Wrong
import MyComponent from "./MyComponent";

// ✅ Correct
import { MyComponent } from "./MyComponent";
```

## Applies To

- All React components (page, layout, UI, client, server)
- Applies project-wide for any TypeScript/TSX file

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| `export default function Foo()` | `export const Foo = () =>` |
| `export default Foo` at bottom | Remove; use named export on declaration |
| `import Foo from "./Foo"` | `import { Foo } from "./Foo"` |
