# core Tutorial

## Generic analytic helper

```moonbit
fn hypot2[T : Add + Mul + Sqrt](x : T, y : T) -> T {
  (x * x + y * y).sqrt()
}
```

This expresses exactly which capability the algorithm needs, without tying it
to one concrete numeric type.

## Checked division

```moonbit
fn safe_ratio[T : DivChecked](x : T, y : T) -> Result[T, ArithmeticError] {
  x.div_checked(y, ArithmeticContext::new(32))
}
```

Use the checked layer when zero-division, domain validity, or precision
sensitivity should be surfaced explicitly.

## Checked comparison

```moonbit
fn ordering_or_error[T : CompareChecked](lhs : T, rhs : T) -> Result[Int, ArithmeticError] {
  lhs.compare_checked(rhs)
}
```

This is the right path when unordered values such as NaN must not be silently
coerced into a total order.

## Practical guidance

- Use unchecked traits only when direct backend semantics are acceptable.
- Use checked traits at API boundaries.
- Keep algebraic structure in `luna-generic`; use `arithmetic` for analytic
  capabilities.
