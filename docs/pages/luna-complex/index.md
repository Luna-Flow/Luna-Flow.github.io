# Luna-Flow/luna-complex

This documentation tracks the current repository baseline for **v0.3.0**.

## Repository Positioning

Generic complex-number core with a separate floating analytic backend.

## Documentation Layout

- `README.md` for the repository narrative and release baseline.
- `doc_standard.md` for the documentation contract.
- Module or subsystem folders with `api.md`, `tutorial.md`, and `design.md`.

## Module Overview

- **`core`**: Generic `Complex[T]` construction, mutation, and algebraic trait implementations.
- **`float_backend`**: Backend-local floating traits and the current `Complex[Double]` analytic function surface.

## Documentation Entry Points

- API Reference: [core](/luna-complex/core/api)
- API Reference: [float_backend](/luna-complex/float_backend/api)
