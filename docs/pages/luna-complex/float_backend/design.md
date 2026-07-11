# float_backend Design

The `float_backend` package owns floating-point analytic behavior for complex numbers.

## Responsibilities

- Keep floating arithmetic, special values, and branch-cut semantics out of the root package.
- Keep backend capability traits local to this package until a broader ecosystem trait is justified.
- Preserve the current `Complex[Double]` stability behavior while allowing future `Float` analytic functions to share the backend capability surface.
- Keep helper code internal unless a function is part of the documented public API.

## Maintenance Notes

- Update this page when public backend traits or analytic function signatures change.
- Do not imply full `Complex[Float]` analytic coverage until those functions are actually exported.
