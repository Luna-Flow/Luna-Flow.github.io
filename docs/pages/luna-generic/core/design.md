# core Design

## Design goal

`luna-generic` gives LunaFlow a shared algebraic vocabulary. Packages such as
`arithmetic`, `luna-complex`, `linear-algebra`, and `luna-poly` should be able
to describe their requirements in terms of reusable traits instead of inventing
their own incompatible capability layers.

## Main design decisions

- The trait graph is layered and intentionally small.
- Structural traits such as `Ring`, `Field`, `Integral`, and `Nat` are kept
  separate from operational traits such as `Zero`, `One`, `Inverse`, and
  `Conjugate`.
- Embeddings are explicit through `NatHomomorphism` and
  `IntegralHomomorphism`.
- `Integral::normalize` is the canonical exact bridge into `BigInt`.
- Target-side default homomorphism implementations are expected to route
  through normalized `BigInt` values.
- Unsigned types stop before additive inverse, so the abstraction stays
  mathematically honest.

## Boundaries

- This package does not define matrices, complex numbers, polynomials, parsing,
  or numerical algorithms.
- It does not erase the semantic difference between exact and approximate
  number systems.
