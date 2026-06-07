# spec Tutorial

Read the formal spec, governance rules, and manual together before changing proof-language or kernel behavior.

## Suggested Flow

1. Read the repository README and the spec API reference.
2. Start from the constructors or entry points under `doc/qed_formal_spec.typ`.
3. Validate behavior with the existing tests or examples before depending on edge-case semantics.

## Practical Guidance

- Prefer the documented entry points over internal helpers.
- Record runtime, numeric, or proof-state assumptions explicitly in downstream code.
\n