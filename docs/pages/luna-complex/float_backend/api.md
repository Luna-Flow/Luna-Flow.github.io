# float_backend API

`Luna-Flow/luna-complex/float_backend` exposes the floating analytic backend for complex numbers.

## Scope

- Source boundary: `src/float_backend`
- Audience: package users, integrators, and maintainers who need the exported contract
- Status: active

## Public Contract

- Re-exports `Complex[T]` from the root package.
- Defines backend capability traits: `FloatingAnalyticScalar`, `FloatingSpecialValues`, and `FloatingBackendScalar`.
- Provides `Float` and `Double` implementations for the backend traits.
- Exposes the current complete analytic function surface for `Complex[Double]`: polar construction, argument and magnitude helpers, square root, exponentials, logarithms, powers, trigonometric functions, inverse trigonometric functions, hyperbolic functions, and inverse hyperbolic functions.
- Keeps IEEE special-value behavior, branch choices, and numeric-stability helpers inside this package instead of the generic root package.
