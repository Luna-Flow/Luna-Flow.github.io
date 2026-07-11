# immut API

This page documents the current public API of `Luna-Flow/luna-poly/immut`. The package provides value-oriented polynomial containers: constructors copy input arrays, algebraic operations return new values, and existing values are not mutated.

Use `src/immut/pkg.generated.mbti` and `moon info` as the exact signature source.

`immut` is a facade over `immut/dense`, `immut/term`, `immut/sparse`, and
`immut/context`. It also re-exports the shared `core` capability traits:
`HasLength`, `HasDegree`, `IsZero`, `HasTermCount`, `HasArity`,
`HasTotalDegree`, `HasContext`, `HasShape`, `UnivariatePolynomial`,
`MultivariatePolynomial`, and `ContextualPolynomial`. Concrete polynomial
types expose `Type::ops()` records for generic functional algorithms.

The facade also re-exports `luna-generic` algebra traits such as `Zero`, `One`,
`AddMonoid`, `MulMonoid`, `Semiring`, `Ring`, `Field`, and `Num`.

`PolynomialShape` is the shared dimension descriptor. Use
`HasShape::shape(value)` to inspect univariate length, multivariate arity and
term count, or contextual `VariableContext` compatibility.

---

## ExponentVector

`ExponentVector` represents the exponent vector of a multivariate monomial. For example, `[2, 0, 1]` represents `x^2 * x_2`. Trailing zero exponents are removed and the total degree is cached.

### Construction And Queries

- `ExponentVector::from_array(values : Array[UInt]) -> ExponentVector`

  Builds a canonical exponent vector. The input array is copied.

- `ExponentVector::one() -> ExponentVector`

  Returns the multiplicative unit, represented by the empty exponent vector.

- `length(self : ExponentVector) -> Int`

  Returns the canonical storage length, excluding trailing zeroes.

- `degree(self : ExponentVector) -> UInt`

  Returns the sum of all exponents.

- `is_one(self : ExponentVector) -> Bool`

  Checks whether the vector is the unit exponent.

- `get(self : ExponentVector, index : Int) -> UInt`

  Supports `v[i]`. Non-negative indexes beyond the stored length return `0`; negative indexes abort.

- `get_checked(self : ExponentVector, index : Int) -> UInt?`

  Returns `None` for negative indexes.

- `with_exponent(self : ExponentVector, index : Int, value : UInt) -> ExponentVector`

  Returns a new vector with one exponent replaced and the result canonicalized.

- `with_exponent_checked(self : ExponentVector, index : Int, value : UInt) -> ExponentVector?`

  Returns `None` for negative indexes.

- `to_array(self : ExponentVector) -> Array[UInt]`

  Returns a copy of the exponent array.

`ExponentVector` implements `One`, `Mul`, `Eq`, `Compare`, `Hash`, and `Show`. Multiplication adds exponents pointwise; comparison orders by total degree first, then by higher variable index down to lower index.

---

## DensePolynomial[A]

`DensePolynomial[A]` is a dense univariate polynomial. Public inputs and outputs use ascending coefficient arrays: `[1, 2, 3]` means `1 + 2x + 3x^2`. Internally, canonical coefficients are stored in a core immutable vector. Trailing zero coefficients are removed after construction and operations; the zero polynomial is stored as an empty vector.

### Construction And Queries

- `DensePolynomial::from_coefficients(values : Array[A]) -> DensePolynomial[A]`

  Builds a polynomial from ascending coefficients, requiring `A : Eq + Zero`.
  Algebraic operations add only the capabilities they use; `moon info` is the
  source of truth for exact operation bounds.

- `DensePolynomial::constant(value : A) -> DensePolynomial[A]`

  Builds a constant polynomial.

- `DensePolynomial::variable() -> DensePolynomial[A]`

  Builds the variable `x`.

- `DensePolynomial::monomial(power : Int, coefficient : A) -> DensePolynomial[A]`

  Builds `coefficient * x^power`. `power` must be non-negative; a zero coefficient returns zero.

- `DensePolynomial::monomial_checked(power : Int, coefficient : A) -> DensePolynomial[A]?`

  Returns `None` for negative powers.

- `to_coefficients`, `length`, `degree`, `coefficient`, `leading_term`, `leading_coefficient`

  Query the canonical coefficient representation. Out-of-range non-negative coefficients read as zero.

- `coefficient_checked(power : Int) -> A?`

  Returns `None` for negative powers and `Some(zero)` for non-negative powers beyond the canonical length.

### Operations

- `+`, `-`, `*`

  DensePolynomial addition, subtraction, and convolution multiplication.

- `scale(self : DensePolynomial[A], power : Int, coefficient : A) -> DensePolynomial[A]`

  Returns `coefficient * x^power * self`.

- `scale_checked(self : DensePolynomial[A], power : Int, coefficient : A) -> DensePolynomial[A]?`

  Returns `None` for negative powers.

- `eval(self : DensePolynomial[A], value : A) -> A`

  Evaluates with Horner form.

- `substitute(self : DensePolynomial[A], value : DensePolynomial[A]) -> DensePolynomial[A]`

  Substitutes another polynomial for `x`.

- `derivative(self : DensePolynomial[A]) -> DensePolynomial[A]`

  Returns the formal derivative. The coefficient type must support `NatHomomorphism`.

- `pow(self : DensePolynomial[A], exponent : UInt) -> DensePolynomial[A]`

  Natural-number exponentiation; also exposed through `arithmetic.PowNatChecked`.

- `karatsuba(self : DensePolynomial[A], other : DensePolynomial[A]) -> DensePolynomial[A]`

  Karatsuba multiplication. Small inputs fall back to ordinary multiplication.

---

## TermPolynomial[A]

`TermPolynomial[A]` is a multivariate polynomial backed by a canonical sorted term sequence stored in a core immutable vector. Each term is `(ExponentVector, A)`. Duplicate exponents are merged and zero coefficients are removed.

- `TermPolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> TermPolynomial[A]`
- `TermPolynomial::from_array(terms : Array[(Array[UInt], A)]) -> TermPolynomial[A]`
- `to_terms(self : TermPolynomial[A]) -> Array[(ExponentVector, A)]`
- `size(self : TermPolynomial[A]) -> Int`
- `coefficients(self : TermPolynomial[A]) -> Array[A]`
- `scale(self : TermPolynomial[A], exponent : ExponentVector, coefficient : A) -> TermPolynomial[A]`
- `eval(self : TermPolynomial[A], values : Array[A]) -> A`
- `eval_checked(self : TermPolynomial[A], values : Array[A]) -> A?`
- `pow(self : TermPolynomial[A], exponent : UInt) -> TermPolynomial[A]`

`TermPolynomial` implements `Zero`, `One`, `Add`, `Neg`, `Sub`, `Mul`, `Show`, and `arithmetic.PowNatChecked`. Evaluation aborts if a term needs a variable index missing from the `values` array.

Convert explicitly with `SparsePolynomial::from_terms(term.to_terms())`.

---

## SparsePolynomial[A]

`SparsePolynomial[A]` is another multivariate representation backed by `SortedMap[ExponentVector, A]`. It is useful when callers need lookup by exponent.

- `SparsePolynomial::new() -> SparsePolynomial[A]`
- `SparsePolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> SparsePolynomial[A]`
- `SparsePolynomial::from_array(terms : Array[(Array[UInt], A)]) -> SparsePolynomial[A]`
- `to_terms(self : SparsePolynomial[A]) -> Array[(ExponentVector, A)]`
- `size(self : SparsePolynomial[A]) -> Int`
- `is_empty(self : SparsePolynomial[A]) -> Bool`
- `get(self : SparsePolynomial[A], exponent : ExponentVector) -> A?`
- `get_checked(self : SparsePolynomial[A], exponent : ExponentVector) -> A?`
- `add_term(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> SparsePolynomial[A]`
- `scale(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> SparsePolynomial[A]`
- `eval(self : SparsePolynomial[A], values : Array[A]) -> A`
- `eval_checked(self : SparsePolynomial[A], values : Array[A]) -> A?`
- `pow(self : SparsePolynomial[A], exponent : UInt) -> SparsePolynomial[A]`

`SparsePolynomial` implements `Zero`, `One`, `Add`, `Neg`, `Sub`, `Mul`, `Eq`, `Show`, and `arithmetic.PowNatChecked`.

Convert explicitly with `TermPolynomial::from_terms(sparse.to_terms())`.

---

## VariableContext And ContextPolynomial[A]

`Variable` and `VariableContext` provide a named-variable layer over the
position-indexed `ExponentVector` model. Variable names are unique inside one
context, and each variable has a stable context-local index.

- `VariableContext::new() -> VariableContext`
- `VariableContext::from_names(names : Array[String]) -> VariableContext`
- `VariableContext::from_names_checked(names : Array[String]) -> VariableContext?`
- `extend`, `extend_checked`, `variable`, `require_variable`, `contains`, `size`, `variables`, `get`
- `Variable::name() -> String`
- `Variable::index() -> Int`
- `Variable::to_type_theory_name() -> @type_theory/core.Name`
- `VariableContext::variable_by_type_theory_name`, `require_type_theory_name`

`ContextPolynomial[A]` binds a `VariableContext` to either term-array or sparse
storage.

- `ContextSubstitutionValue[A]`

  Substitution payload for context polynomials. `Scalar(value)` replaces a
  variable with a coefficient value; `Polynomial(value)` replaces it with a
  same-context polynomial.

- `ContextPolynomial::constant`
- `ContextPolynomial::variable`, `variable_checked`
- `ContextPolynomial::from_term_polynomial`
- `ContextPolynomial::from_sparse_polynomial`
- `ContextPolynomial::from_named_terms_as_terms`, `from_named_terms_as_terms_checked`
- `ContextPolynomial::from_named_terms_as_sparse`, `from_named_terms_as_sparse_checked`
- `context`, `to_terms`, `to_term_polynomial`, `to_sparse_polynomial`
- `eval(values : Array[A])`
- `eval_checked(values : Array[A]) -> A?`
- `eval_named(assignments : Array[(Variable, A)])`
- `eval_named_checked(assignments : Array[(Variable, A)]) -> A?`
- `eval_partial`, `eval_partial_checked`
- `eval_partial_named`, `eval_partial_named_checked`
- `substitute`, `substitute_checked`
- `substitute_names`, `substitute_names_checked`
- `add_checked`, `mul_checked`, `pow`

Checked APIs return `None` for variables outside the context, duplicate or
incomplete named assignments, incompatible contexts, invalid substitution
targets, duplicate substitution entries, or unknown `type_theory` names.
`variable_checked` also returns `None` when the variable belongs to another
context.

Partial evaluation preserves the existing `VariableContext`; it does not
project away assigned variables. Substitution is simultaneous and one pass:
inserted replacement polynomials are not recursively substituted again in the
same call. Convenience APIs abort for the same contract failures. Ordinary
`+`, `-`, and `*` abort on incompatible contexts.

Substitution APIs use `Luna-Flow/type_theory` names for `*_names` variants, but
canonicalization, powers, zero-term removal, and polynomial storage remain
owned by `luna-poly`.
