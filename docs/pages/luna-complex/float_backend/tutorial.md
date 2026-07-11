# float_backend Tutorial

Use `float_backend` when a `Complex[Double]` value needs analytic or transcendental functions.

## Suggested Flow

1. Import `Complex` from the root package or through `float_backend`.
2. Construct a `Complex[Double]` value.
3. Call free functions such as `@float_backend.log(z)`, `@float_backend.sin(z)`, or `@float_backend.sqrt(z)`.

## Practical Guidance

- Prefer the free functions in this package over duplicating formulas downstream.
- Treat branch-sensitive functions such as `arg`, `log`, `sqrt`, and inverse trigonometric functions as part of this package's observable contract.
- Use the backend traits only when writing new floating backend code.
