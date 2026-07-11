# core API

## Purpose

`arithmetic` extends `luna-generic` with analytic capabilities. It models
callable traits such as square root, logarithm, and trigonometric functions,
plus checked/contextual arithmetic boundaries.

## Unchecked capability traits

- `Sqrt`, `Cbrt`, `Radical`
- `Exponential`
- `Logarithmic`
- `Power`
- `Trigonometric`, `InverseTrigonometric`
- `Hyperbolic`, `InverseHyperbolic`
- `Constants`

These are defined in `src/elementary.mbt`.

## Checked and contextual surface

### Shared types

- `FpClass`
- `RoundingMode`
- `ArithmeticContext`
- `ArithmeticErrorKind`
- `ArithmeticError`

### Checked traits

- `SqrtChecked`
- `DivChecked`
- `CompareChecked`
- `PowNatChecked`
- `PowIntChecked`
- `ParseChecked`

### Enclosure relations

- `Contains`
- `Overlaps`
- `DefinitelyLt`
- `DefinitelyLe`
- `MaybeEq`

These are defined in `src/checked.mbt`.

## Shipped instances

- `Float` and `Double` implement the broad elementary surface through
  `Kaida-Amethyst/math`.
- `Float` and `Double` also implement `sqrt_checked`, `div_checked`,
  `compare_checked`, `pow_nat_checked`, and `pow_int_checked`.
- `BigInt` and the integer family implement the narrower exact subset, most
  notably integer `Power`.

## Semantic notes

- Unchecked traits leave domain restrictions and branch semantics to the
  concrete instance.
- Checked traits also use instance-defined domains; `SqrtChecked` does not
  require every implementation to support real-number ordering or comparison
  with zero.
- `DivChecked` likewise does not require floating-point concepts such as NaN or
  infinity; invalid division is defined by each concrete instance.
- The shipped `Float` and `Double` checked square roots are default real-valued
  instances, so negative real inputs return `DomainError`.
- The shipped `Float` and `Double` checked divisions classify `0 / 0` and
  `infinity / infinity` as `DomainError`, while non-zero division by zero
  remains `DivisionByZero`.
- On signed integers and `BigInt`, `Power` requires a non-negative exponent;
  negative exponents abort at runtime.
- `ArithmeticContext::new` clamps precision to at least `1`.
- `PowNatChecked` treats `x^0` as the multiplicative identity, including `0^0`.
- Enclosure traits are relations, not a fake total order.
