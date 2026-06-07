# Contribution Guidelines

View this guide in [zh_CN](https://github.com/Luna-Flow/luna-complex/tree/main/doc/zh_CN/CONTRIBUTING.md) | [ja_JP](https://github.com/Luna-Flow/luna-complex/tree/main/doc/ja_JP/CONTRIBUTING.md)

## Code Style

- Format all code with `moon fmt`.
- Prefer the shared aliases imported in `src/alias.mbt` instead of scattering repeated fully-qualified calls across implementation files.
- Keep comments short and technical. Comments should explain numerical stability choices, branch selection, or non-obvious contracts, not restate the code.

## Naming Conventions

- Bindings and functions: lowercase with underscores, such as `scaled_re` or `pow_real`.
- Types and traits: PascalCase, such as `Complex`.
- Files: lowercase with underscores, and named after a specific behavior rather than a vague bucket.
- If an error code is introduced later, use uppercase with underscores and an `E_` prefix.

## File Organization

- Organize files by package boundary first, then by behavior.
  In this repository, the root package owns the generic `Complex[T]` core, while `src/double_ext` owns the `Complex[Double]` analytic layer.
- Inside each package, keep core data operations, elementary functions, trigonometric functions, hyperbolic functions, and tests in separate files.
- Avoid catch-all files such as `utils.mbt`. New files should describe the behavior they own.
- Keep public API changes deliberate. Internal helpers should remain internal unless the package genuinely needs to expose them.
- Do not assume the `double_ext` package can add methods to `Complex[T]`.
  Under current MoonBit rules, subpackages cannot attach methods or trait impls to a type defined in another package, so `double_ext` uses free functions.

## Testing

- Add or update tests whenever changing numerical behavior.
- Prefer a mix of regression examples and algebraic identity checks.
- Preserve coverage for both layers:
  generic algebraic behavior in the root package and `Complex[Double]` analytic behavior in `double_ext`.
- Use `moon test --enable-coverage` before submitting changes.
- Regenerate `pkg.generated.mbti` with `moon info` whenever the public API changes.

## Commit Guidelines

- Run `./ready_to_pr.sh` before committing when the change affects code or public API.
- Use concise English Conventional Commit messages such as `fix: stabilize inverse trigonometric branches`.
- Keep each commit focused on one logical change.

## Release Checklist

- Update `moon.mod` before publishing a new package version.
- Ensure `README.md` reflects the current package state.
- Run `moon check` and `moon test --enable-coverage`.
- When triggering GitHub Actions `publish-package`, provide the exact version from `moon.mod`.

## Code Review

- If you are not a maintainer or collaborator, contact them before changing dependency or version declarations in `moon.mod`.
- Reviews should focus on correctness, numerical stability, API clarity, tests, and maintainability.
