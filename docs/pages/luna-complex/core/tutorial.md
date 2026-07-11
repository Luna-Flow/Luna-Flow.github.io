# core Tutorial

Use the root package when you need generic complex construction and algebraic operations.

## Suggested Flow

1. Import the root package and bring `Complex` into scope.
2. Construct values with `Complex::new(re, im)`.
3. Use algebraic operators when the scalar type implements the required Luna Flow traits.

## Practical Guidance

- Use `Complex[Double]` for ordinary floating-point values and `Complex[Complex[Double]]` when nested algebraic behavior is useful.
- Use `set`, `set_re`, and `set_im` only when mutation is intended.
- Use `float_backend` for transcendental and branch-sensitive floating behavior.
