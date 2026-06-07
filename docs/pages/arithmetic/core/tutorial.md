# core Tutorial

Start from the capability traits in `src/checked.mbt`, `src/elementary.mbt`, and the numeric instance files.

## Suggested Flow

1. Read the repository README and the core API reference.
2. Start from the constructors or entry points under `src`.
3. Validate behavior with the existing tests or examples before depending on edge-case semantics.

## Practical Guidance

- Prefer the documented entry points over internal helpers.
- Record runtime, numeric, or proof-state assumptions explicitly in downstream code.
