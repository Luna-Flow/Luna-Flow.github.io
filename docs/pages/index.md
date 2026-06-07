---
layout: home

hero:
  name: "Luna Flow"
  text: "Composable Mathematical Ecosystem for MoonBit"
  tagline: "A modern scientific computing foundation centered around algebraic abstraction, numerical reliability, and ecosystem interoperability."
  image:
    src: "/logo.svg"
    alt: "Luna Flow Logo"
  actions:
    - theme: brand
      text: "Browse Documentation"
      link: "/docs/"
    - theme: alt
      text: "GitHub"
      link: "https://github.com/Luna-Flow"

features:
  - title: "Shared Abstractions"
    details: "Build around reusable algebraic and arithmetic traits instead of isolated numeric APIs."
  - title: "Composability"
    details: "Connect 16 Luna-Flow repositories through one interoperable mathematical ecosystem."
  - title: "Multiple Semantics"
    details: "Support floating-point, arbitrary-precision, polynomial, matrix, and future symbolic worlds without erasing their differences."
---

## Vision

LunaFlow envisions MoonBit as a language capable of supporting serious mathematical software: from lightweight numerical utilities to rigorous scientific computing, symbolic manipulation, and future proof-oriented systems.
We believe a mathematical ecosystem should not be built as a pile of unrelated APIs. It should be organized around precise abstractions:

* algebraic structures such as monoids, rings, fields, and integral domains;
* arithmetic capabilities such as square root, exponential, logarithmic, and trigonometric functions;
* generic constructions such as complex numbers, vectors, matrices, and polynomials;
* multiple numerical semantics, including machine floating point, arbitrary precision, decimal arithmetic, and error-aware computation.

With this architecture, one algorithm can be written once and reused across different mathematical worlds.

## Mission

LunaFlow’s mission is to provide a foundational mathematical interoperability layer for MoonBit.

1. Building reusable algebraic and arithmetic traits.
2. Providing generic mathematical data structures.
3. Supporting multiple numerical backends.
4. Allowing external MoonBit math libraries to join the ecosystem through lightweight adapters.
5. Making advanced mathematical computation more reliable, modular, and accessible.

LunaFlow is not designed as a closed framework. Existing libraries should not need to be rewritten from scratch to participate. If a library can expose the required mathematical capabilities, LunaFlow should be able to integrate it into higher-level abstractions such as complex numbers, linear algebra, and future symbolic computation.

## Design Philosophy

**Abstraction before implementation.** Mathematical software should begin with clear structures and laws. Implementation details matter, but they should not leak into every layer of the ecosystem.

**Small traits, strong composition.** Instead of defining one oversized numeric interface, LunaFlow separates algebraic structures from analytic capabilities. This keeps abstractions flexible and avoids forcing every type into an unsuitable model.

**Semantics must be explicit.** A floating-point number, an arbitrary-precision value, a decimal value, and an interval-like value may all support arithmetic, but they do not mean the same thing. LunaFlow aims to preserve these semantic differences rather than hiding them behind a single vague interface.

**Interoperability over isolation.** MoonBit’s mathematical ecosystem should allow independent libraries to work together. LunaFlow provides the common language that lets different packages become part of the same computational world.

**One algorithm, many mathematical worlds.** A well-designed generic algorithm should be reusable across different numeric representations. LunaFlow makes this possible through trait-based abstraction and carefully layered packages.

## Long-Term Goal

The long-term goal of LunaFlow is to become a foundation for advanced mathematical computing in MoonBit.

* generic algebraic computation;
* linear algebra over multiple scalar types;
* arbitrary-precision and error-aware numerical computing;
* complex numbers over generic base fields;
* polynomial and symbolic computation;
* computable real numbers and more rigorous numerical models;
* scientific computing applications built on top of a shared mathematical core.

LunaFlow is still evolving, but its direction is clear: to turn MoonBit’s abstraction capabilities into a real mathematical ecosystem.

We are building not just a collection of math packages, but a composable foundation for future scientific computing in MoonBit.
