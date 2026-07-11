# Luna-Flow/luna-poly 0.2.0

The library has one shared capability layer and two explicit execution models:

- `core` provides shared types, capability traits, and functional operation
  records.
- `immut` provides persistent value semantics.
- `mutable` provides explicit setters and `_inplace` operations.

Concrete implementations live in mirrored subpackages:

- `immut/dense`, `immut/term`, `immut/sparse`, `immut/context`
- `mutable/dense`, `mutable/term`, `mutable/sparse`, `mutable/context`

The top-level `immut` and `mutable` packages are facades that re-export core
capabilities plus their concrete implementations. Both facades expose dense
univariate, sorted-term multivariate, and ordered-map sparse polynomials.
Canonical form and natural-power behavior are shared across both packages.

Use `UnivariatePolynomial`, `MultivariatePolynomial`,
`ContextualPolynomial`, and `MutablePolynomial` when an algorithm only needs a
capability boundary. Use `Type::ops()` records when functional-style generic
code needs construction, conversion, or algebraic operations without matching
on the storage representation.

The `0.2.0` API also adds `Variable`, `VariableContext`, and
`ContextPolynomial` for named-variable workflows. Context polynomials bind a
variable table to either term-array or sparse storage and support indexed and
named evaluation. See the root README and generated package interfaces for the
current API.

## Package Documents

- `immut/api.md`: value-semantics API reference for `DensePolynomial`,
  `TermPolynomial`, `SparsePolynomial`, and `ExponentVector`.
- `immut/tutorial.md`: examples for dense, multivariate, and sparse immutable
  polynomials.
- `immut/design.md`: canonical-form and representation invariants.
- `mutable/api.md`: mutable API reference, including setters and `_inplace`
  methods.
- `mutable/tutorial.md`: examples for in-place updates and conversions.
- `mutable/design.md`: mutation boundaries and alignment with `immut`.
