# kernel Design

The kernel is the trusted computing base and must stay aligned with the formal specification and conformance documents.

## Responsibilities

- Keep the code and docs aligned around `src/kernel`.
- Preserve the real execution model instead of smoothing over important internal differences.
- Note extension points, invariants, and limitations that maintainers must keep stable.

## Maintenance Notes

- Update this page whenever the module boundary, core algorithm, or observable semantics change.
- If the module is intentionally incomplete, say so here instead of documenting speculative APIs.
\n