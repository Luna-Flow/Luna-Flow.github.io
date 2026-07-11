# immut Design

`immut` is the value-oriented layer of `luna-poly`. It models polynomials, exponent vectors, and multivariate term collections as canonical values.

## Responsibilities

- Re-export shared `core` capability traits through the `immut` facade.
- Provide dense univariate `DensePolynomial[A]`.
- Provide `ExponentVector` as a multivariate exponent key.
- Provide two multivariate representations: sorted term sequence `TermPolynomial[A]` and ordered-map `SparsePolynomial[A]`.
- Implement ordinary algebraic operations and `arithmetic.PowNatChecked` for polynomial types.

## Canonical Form

- `DensePolynomial` stores coefficients in a core immutable vector, removes trailing zero coefficients, and represents zero as an empty vector.
- `ExponentVector` stores exponents in a core immutable vector, removes trailing zero exponents, and caches total degree.
- `TermPolynomial` stores terms in a core immutable vector, merges equal exponents, removes zero coefficients, and keeps terms sorted.
- `SparsePolynomial` stores non-zero terms in a `SortedMap`; an empty map is zero.

These rules are observable through `to_coefficients`, `to_terms`, `size`, `degree`, and equality.

## Value Semantics

Public constructors copy input arrays. Update-like operations return new values, including:

- `ExponentVector::with_exponent`
- `SparsePolynomial::add_term`
- `+`, `-`, `*`, `scale`, and `pow`

Callers may safely reuse old values after any operation.

## Representation Differences

`TermPolynomial` and `SparsePolynomial` describe the same mathematical objects but optimize different access patterns:

- `TermPolynomial` favors ordered traversal and batch algebraic operations over a canonical term sequence.
- `SparsePolynomial` favors lookup by `ExponentVector`.
- Convert explicitly with `SparsePolynomial::from_terms(term.to_terms())` or
  `TermPolynomial::from_terms(sparse.to_terms())`; conversion reapplies
  canonicalization without coupling implementation packages to each other.

## Capability Boundary

Algorithms that only need shared behavior should use `UnivariatePolynomial`,
`MultivariatePolynomial`, or `ContextualPolynomial` instead of matching on a
concrete storage type. When an algorithm needs construction or algebraic
operations in addition to queries, accept the corresponding `Type::ops()`
record and call its function fields.

`HasShape` and `PolynomialShape` provide the dimension layer expected by
generic numeric code: univariate values report coefficient length,
multivariate values report arity and term count, and contextual values report
their `VariableContext` plus arity and term count. Shape compatibility is
available through `PolynomialShape::is_compatible_with` and
`compatible_checked`.

The facade re-exports common `luna-generic` algebra traits (`Zero`, `One`,
`AddMonoid`, `MulMonoid`, `Semiring`, `Ring`, `Field`, and `Num`) so callers can
write polynomial algorithms with the same capability vocabulary used by
`Luna-Flow/linear-algebra`.

Checked methods return `None` for caller contract failures such as negative
powers, negative exponent-vector indexes, incomplete indexed evaluation, or
context mismatch. Convenience methods keep the existing aborting behavior.

## Substitution Boundary

Context-aware substitution uses `Luna-Flow/type_theory` names as the shared
semantic naming layer. `luna-poly` still owns polynomial semantics:
canonicalization, coefficient arithmetic, powers, sparse/term storage, and
context compatibility are handled inside `ContextPolynomial`.

Substitution is simultaneous and one pass. A variable can be replaced by a
scalar coefficient or by a same-context polynomial, but inserted replacement
polynomials are not recursively substituted again in the same call. Partial
evaluation is the scalar-only specialization and preserves the original
`VariableContext` instead of projecting away assigned variables. Checked
substitution rejects foreign variables, duplicate replacement entries, unknown
`type_theory` names, and polynomial replacements from incompatible contexts.

## Maintenance Notes

- Document only APIs that exist on the current branch.
- Update this page when canonicalization, term ordering, zero handling, or evaluation abort conditions change.
- Document any observable divergence from `mutable` in the corresponding `mutable` pages.
