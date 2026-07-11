# mutable Tutorial

Use `mutable` when code needs explicit control over intermediate allocation or step-by-step construction. The mathematical semantics match `immut`, but mutation is limited to setters, `clear`, and `_inplace` methods.

## Dense Univariate DensePolynomial

```moonbit
let p = @mutable.DensePolynomial::from_coefficients([1, 2, 3])
let snapshot = p.copy()

p.set_coefficient(1, 5)
p.add_inplace(@mutable.DensePolynomial::from_coefficients([-1, -5, -3]))
```

`snapshot` still represents `1 + 2x + 3x^2`. `p` is updated and then canonicalized to zero.

Ordinary operators do not mutate the receiver:

```moonbit
let p = @mutable.DensePolynomial::from_coefficients([1, 2])
let q = p * p
let unchanged = p.to_coefficients()
```

`q` is a new polynomial and `unchanged` is `[1, 2]`.

## Converting To And From immut

```moonbit
let imm = @immut.DensePolynomial::from_coefficients([1, 0, 1])
let mut_poly = @mutable.DensePolynomial::from_immut(imm)
mut_poly.set_coefficient(0, 2)
let back = mut_poly.to_immut()
```

Conversions produce independent values.

## Multivariate Term Arrays

```moonbit
let p = @mutable.TermPolynomial::from_array([([1U], 2)])
p.add_term_inplace(@mutable.ExponentVector::from_array([1U, 0]), -2)
let is_zero = p.size() == 0
```

The two exponent vectors canonicalize to the same key, so the terms cancel.

## Sparse Map Representation

```moonbit
let x = @mutable.ExponentVector::from_array([1U])
let p = @mutable.SparsePolynomial::new()
p.set_coefficient(x, 3)
p.add_term_inplace(x, -1)
let coeff = p.get(x)
```

`coeff` is `Some(2)`. Setting a coefficient to zero removes the term.

## Guidance

- Use `_inplace` only when mutating the receiver is intentional.
- Prefer `immut` when code relies on sharing old values.
- Use `to_immut` and `from_immut` at API boundaries to isolate mutable state.
