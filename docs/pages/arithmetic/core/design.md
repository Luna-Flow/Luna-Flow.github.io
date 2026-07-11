# core Design

## Design goal

`arithmetic` extends LunaFlow from algebraic structure into analytic capability,
while keeping semantics explicit and backend-specific.

## Main design decisions

- Analytic behavior is split into many small traits instead of one large “real
  number” interface.
- Unchecked and checked surfaces coexist so callers can choose between direct
  backend behavior and explicit contextual validation.
- The checked layer shares common types such as `ArithmeticContext` and
  `ArithmeticError`.
- Enclosure-style relations are separated from scalar comparison to avoid
  semantic lies.
- Integer-family instances stay narrow and only expose operations that remain
  closed on those types.

## Boundaries

- This package does not define vectors, matrices, complex numbers, or symbolic
  objects.
- It does not hide branch-cut or exceptional-value semantics behind one vague
  abstraction.
