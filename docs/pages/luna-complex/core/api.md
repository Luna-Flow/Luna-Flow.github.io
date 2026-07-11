# core API

The root package `Luna-Flow/luna-complex` exposes the generic complex-number core.

## Scope

- Source boundary: `src`
- Audience: package users, integrators, and maintainers who need the exported contract
- Status: active

## Public Contract

- `Complex[T]` is a mutable struct with public `re` and `im` fields.
- Constructors and mutators are `Complex::new`, `set`, `set_re`, and `set_im`.
- The root package implements generic algebraic operations and Luna Flow traits when the scalar type supplies the matching capability: `Add`, `Sub`, `Neg`, `Mul`, `Div`, `Zero`, `One`, `Conjugate`, `Inverse`, `AddMonoid`, `AddGroup`, `MulMonoid`, `MulGroup`, `Semiring`, `Ring`, and `Field`.
- The root package does not expose analytic functions such as `sin`, `log`, or `sqrt`; use `Luna-Flow/luna-complex/float_backend` for the floating analytic layer.
