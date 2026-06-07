# Luna-Generic

English documentation for the intended `v0.3.2` release of `Luna-Flow/luna-generic`.

## Overview

`luna-generic` provides general algebraic traits and default numeric instances for Luna projects.

The current release candidate centers on three changes:

- `BigInt` is now part of the default exported numeric surface.
- Integral-to-target conversions are expressed through explicit homomorphism traits.
- `Integral::normalize` now provides a canonical `BigInt` form for all integral source types.

## Exported Traits

- `AddMonoid`, `MulMonoid`
- `AddGroup`, `MulGroup`
- `Semiring`, `Ring`, `Field`
- `Integral`, `Nat`
- `NatHomomorphism`, `IntegralHomomorphism`
- `Num`

## Exported Operations and Default Types

- Operations: `One`, `Zero`, `Inverse`, `Conjugate`
- Default numeric types: `Int`, `Int16`, `Int64`, `UInt`, `UInt16`, `UInt64`, `BigInt`, `Float`, `Double`

## Integer Model

- `Nat` covers `UInt`, `UInt16`, and `UInt64`
- `Integral` covers signed integers, unsigned integers, and `BigInt`
- Unsigned integer instances stop at `Semiring`
- `Integral::normalize` canonicalizes any integral value into `BigInt`
- `Nat::to_integral` provides an exact embedding into `BigInt`

## Embeddings

- `NatHomomorphism::{from_uint, from_uint16, from_uint64}` provides target-side embeddings from natural-number source types
- `IntegralHomomorphism::{from_int, from_int16, from_int64, from_bigint}` provides target-side embeddings from integral source types
- `BigInt` embeddings are exact
- `Float` and `Double` embeddings are approximate and may round large values

## Validation

Recommended release checks:

```bash
moon check
moon test
```
