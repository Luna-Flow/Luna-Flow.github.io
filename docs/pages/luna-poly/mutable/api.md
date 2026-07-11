# mutable API

This page documents the current public API of `Luna-Flow/luna-poly/mutable`. The package exposes the same core type names as `immut`, but its containers are execution-oriented: setters, `clear`, and `_inplace` methods mutate the receiver; ordinary operators still return new values.

Use `src/mutable/pkg.generated.mbti` and `moon info` as the exact signature source.

`mutable` is a facade over `mutable/dense`, `mutable/term`, `mutable/sparse`,
and `mutable/context`. It re-exports the shared `core` capability traits,
including `UnivariatePolynomial`, `MultivariatePolynomial`,
`ContextualPolynomial`, `HasShape`, and `MutablePolynomial`. Concrete polynomial types
expose `Type::ops()` records for generic functional algorithms.

The facade also re-exports `luna-generic` algebra traits such as `Zero`, `One`,
`AddMonoid`, `MulMonoid`, `Semiring`, `Ring`, `Field`, and `Num`. Mutable
containers implement the same `PolynomialShape` metadata as immutable
containers.

---

## ExponentVector

`mutable.ExponentVector` is a value wrapper around `immut.ExponentVector`. It does not provide in-place mutation; it exists as the exponent key used by mutable multivariate containers.

- `ExponentVector::from_array(values : Array[UInt]) -> ExponentVector`
- `ExponentVector::one() -> ExponentVector`
- `ExponentVector::from_immut(value : @immut.ExponentVector) -> ExponentVector`
- `to_immut(self : ExponentVector) -> @immut.ExponentVector`
- `to_array`, `length`, `degree`, `is_one`, `get`, `get_checked`, `with_exponent`, `with_exponent_checked`

Trait implementations delegate to `immut.ExponentVector`: `One`, `Mul`, `Eq`, `Compare`, `Hash`, and `Show`.

---

## DensePolynomial[A]

`DensePolynomial[A]` is a mutable dense univariate polynomial. Coefficients are still stored in ascending degree order and trailing zeroes are removed.

### Construction, Conversion, And Queries

- `DensePolynomial::from_coefficients(values : Array[A]) -> DensePolynomial[A]`
- `DensePolynomial::from_immut(value : @immut.DensePolynomial[A]) -> DensePolynomial[A]`
- `to_immut(self : DensePolynomial[A]) -> @immut.DensePolynomial[A]`
- `to_coefficients`, `length`, `degree`, `leading_term`, `leading_coefficient`, `coefficient`
- `coefficient_checked`
- `DensePolynomial::constant`, `DensePolynomial::variable`, `DensePolynomial::monomial`, `DensePolynomial::monomial_checked`

### Mutating Operations

- `set_coefficient(self : DensePolynomial[A], power : Int, coefficient : A) -> Unit`

  Sets one coefficient, resizing when needed and canonicalizing afterward.

- `clear(self : DensePolynomial[A]) -> Unit`

  Resets the polynomial to zero.

- `copy(self : DensePolynomial[A]) -> DensePolynomial[A]`

  Returns an independent copy.

- `add_inplace`, `mul_inplace`, `scale_inplace`

  Replace the receiver with the corresponding result.

### Non-Mutating Operations

`+`, `-`, `*`, `scale`, `scale_checked`, `eval`, `substitute`, `derivative`, `pow`, and `karatsuba` return new values or query results and do not mutate the receiver.

---

## TermPolynomial[A]

`TermPolynomial[A]` is a mutable multivariate polynomial backed by a canonical sorted term array.

- `TermPolynomial::from_terms`
- `TermPolynomial::from_array`
- `TermPolynomial::from_immut`
- `to_immut`
- `to_terms`
- `size`
- `coefficients`
- `clear`
- `copy`
- `add_term_inplace`
- `add_inplace`
- `mul_inplace`
- `scale_inplace`
- `scale`
- `eval`
- `eval_checked`
- `pow`

The `_inplace` methods mutate the receiver; ordinary algebraic operators return new values.
Convert explicitly with `SparsePolynomial::from_terms(term.to_terms())`.

---

## SparsePolynomial[A]

`SparsePolynomial[A]` is a mutable multivariate sparse polynomial backed by `SortedMap[ExponentVector, A]`.

- `SparsePolynomial::new`
- `SparsePolynomial::from_terms`
- `SparsePolynomial::from_array`
- `SparsePolynomial::from_immut`
- `to_immut`
- `to_terms`
- `size`
- `is_empty`
- `get`
- `get_checked`
- `set_coefficient`
- `clear`
- `copy`
- `add_term_inplace`
- `add_inplace`
- `mul_inplace`
- `scale_inplace`
- `scale`
- `eval`
- `eval_checked`
- `pow`

`set_coefficient` removes a term when the coefficient is zero. Equality compares canonical term arrays.
Convert explicitly with `TermPolynomial::from_terms(sparse.to_terms())`.

---

## VariableContext And ContextPolynomial[A]

`mutable` re-exports `immut.Variable` and `immut.VariableContext`, so variable
identity is shared across execution models.

`mutable.ContextPolynomial[A]` is a mutable wrapper around
`immut.ContextPolynomial[A]`.

- `ContextSubstitutionValue[A]`

  Mutable substitution payload. `Scalar(value)` replaces a variable with a
  coefficient value; `Polynomial(value)` replaces it with a same-context mutable
  context polynomial and delegates to the immutable substitution semantics.

- `ContextPolynomial::from_immut`
- `to_immut`
- `constant`
- `variable`, `variable_checked`
- `from_term_polynomial`
- `from_sparse_polynomial`
- `from_named_terms_as_terms`, `from_named_terms_as_terms_checked`
- `from_named_terms_as_sparse`, `from_named_terms_as_sparse_checked`
- `context`, `to_terms`, `to_term_polynomial`, `to_sparse_polynomial`
- `eval`, `eval_checked`, `eval_named`, `eval_named_checked`
- `eval_partial`, `eval_partial_checked`, `eval_partial_named`, `eval_partial_named_checked`
- `substitute`, `substitute_checked`, `substitute_names`, `substitute_names_checked`
- `add_inplace`, `mul_inplace`, `copy`, `pow`

`+`, `-`, and `*` return new wrappers. `_inplace` methods replace the receiver
and abort on incompatible contexts.

Partial evaluation preserves the existing `VariableContext`; it does not
project away assigned variables. Name-based variants use
`Luna-Flow/type_theory/core.Name`. Checked variants delegate to the immutable
implementation and return `None` for foreign variables, duplicate assignments,
unknown names, or polynomial replacements from incompatible contexts.
