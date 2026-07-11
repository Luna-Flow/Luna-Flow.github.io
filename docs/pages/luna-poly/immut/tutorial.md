# immut Tutorial

Use `immut` when polynomials should behave like ordinary values. Constructors copy input arrays, updates return new values, and old values remain unchanged.

## Dense Univariate DensePolynomial

```moonbit
let p = @immut.DensePolynomial::from_coefficients([1, 2, 3])
let q = @immut.DensePolynomial::variable()
let value = p.eval(2)
let composed = p.substitute(q + @immut.DensePolynomial::constant(1))
```

`p` represents `1 + 2x + 3x^2`, so `value` is `17`. `substitute` does not mutate `p`.

Constructors keep canonical form:

```moonbit
let p = @immut.DensePolynomial::from_coefficients([1, 2, 0, 0])
let coefficients = p.to_coefficients()
```

`coefficients` is `[1, 2]`.

## Exponent Vectors

```moonbit
let xy2 = @immut.ExponentVector::from_array([1U, 2])
let x = xy2.with_exponent(1, 0)
let degree = xy2.degree()
```

`xy2` represents `x * x_1^2`; its total degree is `3`. `x` is a new value.

## Multivariate Term Arrays

```moonbit
let p = @immut.TermPolynomial::from_array([
  ([1U, 0], 2),
  ([1U], -2),
  ([0U, 1], 3),
])
let value = p.eval([5, 2])
```

The first two terms have equivalent exponents and cancel out. The remaining term is `3 * x_1`, so `value` is `6`.

## Sparse Map Representation

```moonbit
let p = @immut.SparsePolynomial::from_array([
  ([2U], 1),
  ([1U], 2),
  ([], 1),
])
let coeff = p.get(@immut.ExponentVector::from_array([1U]))
let value = p.eval([2])
```

`p` represents `x^2 + 2x + 1`; `coeff` is `Some(2)` and `value` is `9`.

## Choosing A Representation

- Use `DensePolynomial` for dense univariate polynomials.
- Use `TermPolynomial` for sequential multivariate term processing.
- Use `SparsePolynomial` when exponent lookup matters.
- Convert between multivariate representations explicitly:
  `SparsePolynomial::from_terms(term.to_terms())` or
  `TermPolynomial::from_terms(sparse.to_terms())`.
- Use `UnivariatePolynomial`, `MultivariatePolynomial`, `ContextualPolynomial`,
  or `Type::ops()` when generic code should not depend on the storage
  representation.
