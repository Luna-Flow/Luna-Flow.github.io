# core Design

The root package owns generic `Complex[T]` structure, algebraic operations, and trait-driven constraints.

## Responsibilities

- Keep `Complex[T]` generic and independent of floating-point analytic semantics.
- Preserve the mutable field model because callers may intentionally update `re` or `im` in place.
- Keep algebraic trait implementations constrained by the smallest scalar capability needed.
- Leave branch cuts, NaN, infinity, negative zero, and transcendental functions to `float_backend`.

## Maintenance Notes

- Update this page when the root package gains or loses a public trait implementation.
- Do not document speculative generic analytic APIs in the root package.
