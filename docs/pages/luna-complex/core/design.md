# core Design

The root package owns generic `Complex[T]` structure, algebraic operations, and trait-driven constraints.

## Responsibilities

- Keep the code and docs aligned around `src`.
- Preserve the real execution model instead of smoothing over important internal differences.
- Note extension points, invariants, and limitations that maintainers must keep stable.

## Maintenance Notes

- Update this page whenever the module boundary, core algorithm, or observable semantics change.
- If the module is intentionally incomplete, say so here instead of documenting speculative APIs.
