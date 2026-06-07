# backend Design

This subsystem covers the native C runtime scaffold and the Node.js addon scaffold used to realize the FFI design.

## Responsibilities

- Keep the code and docs aligned around `native and js`.
- Preserve the real execution model instead of smoothing over important internal differences.
- Note extension points, invariants, and limitations that maintainers must keep stable.

## Maintenance Notes

- Update this page whenever the module boundary, core algorithm, or observable semantics change.
- If the module is intentionally incomplete, say so here instead of documenting speculative APIs.
\n