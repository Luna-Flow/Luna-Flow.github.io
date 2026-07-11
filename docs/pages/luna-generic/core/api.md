# core API

## Purpose

`luna-generic` is the algebraic trait layer of LunaFlow. It does not provide
numerical algorithms or containers by itself; it defines the reusable
capability surface that higher-level packages depend on.

## Structural traits

- `AddMonoid`, `MulMonoid`
- `AddGroup`, `MulGroup`
- `Semiring`, `Ring`, `Field`
- `Integral`
- `Nat`
- `NatHomomorphism`
- `IntegralHomomorphism`
- `Num`

These traits live in `src/structure.mbt`.

## Operational traits

- `Zero`
- `One`
- `Inverse`
- `Conjugate`

These traits live in `src/operation.mbt`.

## Shipped instances

- Signed integers: `Int`, `Int16`, `Int64`
- Unsigned integers: `UInt`, `UInt16`, `UInt64`
- Exact big integer: `BigInt`
- Floating instances: `Float`, `Double`

## Semantic notes

- `Integral::normalize(Self) -> BigInt` is the canonical exact bridge from any
  integral instance into `BigInt`.
- `Nat` reuses the same `normalize(Self) -> BigInt` bridge via trait inheritance.
- `NatHomomorphism::from_nat` and `IntegralHomomorphism::from_integral` are
  polymorphic embedding entry points over source traits instead of width-specific
  constructors.
- The default embedding strategy is `Integral::normalize` followed by
  target-specific conversion from `BigInt`.
- Unsigned integer instances stop at `Semiring`; they do not pretend to be
  additive groups or rings.
- `Float` and `Double` implement homomorphism traits as approximate embeddings,
  so very large integral values may round.

## Source map

- `src/structure.mbt`: trait definitions
- `src/operation.mbt`: operational traits
- `src/impl_signed.mbt`, `src/impl_unsigned.mbt`, `src/impl_bigint.mbt`,
  `src/impl_float.mbt`, `src/impl_dbl.mbt`: default instances
