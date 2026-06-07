# Arithmetic Documentation

This directory contains the English documentation baseline for `arithmetic` `0.2.1`.

## Core Documents

- Package README: [./README.md](./README.md)

## Surface Summary

- Algebra remains in `luna-generic`.
- `arithmetic` provides function capabilities, not a bundled “real number” abstraction.
- `Float` and `Double` instances live in the root package and call `Kaida-Amethyst/math` directly.
- `BigInt` and the integer family provide only exact capability impls such as integer `Power`.
- These floating-point instances use `Kaida-Amethyst/math` as their backend.
- The package does not model ordering, topology, branch cuts, or principal-value semantics.

## Capability Layers

- Unchecked elementary traits remain available for native scalars and similar context-free backends.
- Checked/contextual traits return `Result[Self, ArithmeticError]` and take `ArithmeticContext`.
- Enclosure traits model containment and overlap relations without forcing a fake scalar total order.

## Semantic Notes

- Public traits preserve the concrete `Self` type instead of widening to helper result types.
- Domain validity remains part of the caller contract unless an instance explicitly documents stronger behavior.
- Floating-point instances inherit edge-value and branch semantics from `Kaida-Amethyst/math`.
- Integer-family support is intentionally narrower and only covers capabilities that remain closed on those types.
- `arithmetic` is a capability-boundary package and does not define calculus, matrices, complex numbers, symbolic algebra, or special-function layers.

## `Power` Preconditions

- `Power::pow` is shared across floating and integer families, but not every instance accepts the same argument space.
- `BigInt`, `Int`, `Int16`, and `Int64` require a non-negative exponent.
- Passing a negative exponent to those signed integer-family instances aborts at runtime.
- `UInt`, `UInt16`, and `UInt64` avoid that specific precondition because their exponent type is already non-negative.
- This package documents the preconditions, but selecting mathematically valid arguments remains partly the caller's responsibility.
- `PowNatChecked` and `PowIntChecked` split integer-exponent power into checked capability boundaries.
- In this checked layer, `x^0` returns one, including `0^0`.
