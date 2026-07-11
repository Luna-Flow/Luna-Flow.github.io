# mutable Design

`mutable` is the execution-oriented layer of `luna-poly`. It reuses the mathematical semantics and canonicalization rules of `immut`, while exposing explicitly mutating container operations.

## Responsibilities

- Re-export shared `core` capability traits through the `mutable` facade.
- Provide `DensePolynomial`, `TermPolynomial`, `SparsePolynomial`, and `ExponentVector` aligned with `immut`.
- Provide `from_immut` and `to_immut` conversions.
- Provide setters, `clear`, `copy`, and `_inplace` operations for incremental construction and updates.
- Keep ordinary algebraic operators non-mutating.

## Mutation Boundary

Public methods that mutate the receiver include:

- `DensePolynomial::set_coefficient`
- `DensePolynomial::clear`
- `DensePolynomial::add_inplace`
- `DensePolynomial::mul_inplace`
- `DensePolynomial::scale_inplace`
- `TermPolynomial::clear`
- `TermPolynomial::add_term_inplace`
- `TermPolynomial::add_inplace`
- `TermPolynomial::mul_inplace`
- `TermPolynomial::scale_inplace`
- `SparsePolynomial::set_coefficient`
- `SparsePolynomial::clear`
- `SparsePolynomial::add_term_inplace`
- `SparsePolynomial::add_inplace`
- `SparsePolynomial::mul_inplace`
- `SparsePolynomial::scale_inplace`

Other ordinary operators and methods such as `scale`, `pow`, and `substitute` return new values.

## Relationship With immut

Many mutable operations convert through `immut` and then convert back. This keeps the two layers aligned on:

- trailing-zero removal for univariate polynomials,
- exponent-vector canonicalization and degree semantics,
- multivariate term merging and zero deletion,
- natural-number exponentiation and `arithmetic.PowNatChecked`.

`mutable.ExponentVector` is a wrapper around `immut.ExponentVector`; it remains value-oriented so it can be used as a stable key.

## Canonical Form

Mutating operations must restore canonical form before returning:

- `DensePolynomial` removes trailing zero coefficients.
- `TermPolynomial` merges duplicate terms and removes zero coefficients.
- `SparsePolynomial` removes map entries whose coefficients become zero.

New in-place operations must preserve these invariants.

## Usage Boundary

Prefer `immut` by default. Use `mutable` when code needs step-by-step updates, fewer explicit intermediate values, or integration with an existing mutable algorithm.

Generic code should depend on `UnivariatePolynomial`, `MultivariatePolynomial`,
`ContextualPolynomial`, `MutablePolynomial`, or the relevant `Type::ops()`
record instead of matching on a concrete mutable storage type.

Mutable containers also implement `HasShape`, so execution-oriented algorithms
can inspect the same `PolynomialShape` metadata as immutable code. The mutable
facade re-exports the `luna-generic` algebra traits used by the linear-algebra
package, and mutable `Type::ops()` records expose construction, addition,
multiplication, evaluation, scaling, and powers for generic algorithms.

Checked methods mirror the immutable layer and return `None` for contract
failures. Existing convenience methods remain aborting wrappers.

Mutable context substitution delegates to the immutable context model. Mutable
wrappers expose the same scalar/polynomial substitution and partial-evaluation
APIs, but the canonical result is produced by the immutable implementation and
then wrapped back into `mutable.ContextPolynomial`. The same checked failure
contracts apply: foreign variables, duplicate assignments, unknown
`type_theory` names, and incompatible replacement polynomial contexts return
`None`.
