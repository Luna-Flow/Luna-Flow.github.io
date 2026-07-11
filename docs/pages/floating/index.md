# FLOATING Documentation

This directory documents the current **`0.4.1`** implementation. Historical
release notes belong in [CHANGELOG.md](https://github.com/Luna-Flow/floating/blob/main/CHANGELOG.md).

## Reader Guide

- Start with `bin_float`, `decimal`, or `ball_float` for concrete values.
- Use the matching `*_result` package for closed checked-arithmetic pipelines.
- Read `semantic` when values from several representations need a common exact
  comparison or serialization boundary.
- Read `numeric_expr` to build a numeric expression frontend; read `gda_expr`
  for the General Decimal Arithmetic `.decTest` frontend and Decimal backend.
- Treat `internal` and `consistency` as implementation and verification layers,
  not as stable application APIs.

## Core Documents

- [Documentation Standard](/floating/doc-standard)
- [Correctness Audit](/floating/correctness_audit)
- [Release History](https://github.com/Luna-Flow/floating/blob/main/CHANGELOG.md)
- [Conformance Workflow](https://github.com/Luna-Flow/floating/blob/main/testdata/decimal/README.md)

## Package Documentation

- [`def`](/floating/def/api): [API](/floating/def/api), [Tutorial](/floating/def/tutorial), [Design](/floating/def/design)
- [`bin_float`](/floating/bin_float/api): [API](/floating/bin_float/api), [Tutorial](/floating/bin_float/tutorial), [Design](/floating/bin_float/design)
- [`decimal`](/floating/decimal/api): [API](/floating/decimal/api), [Tutorial](/floating/decimal/tutorial), [Design](/floating/decimal/design), [Architecture Research](/floating/decimal/architecture_research)
- [`ball_float`](/floating/ball_float/api): [API](/floating/ball_float/api), [Tutorial](/floating/ball_float/tutorial), [Design](/floating/ball_float/design)
- [`bin_float_result`](/floating/bin_float_result/api): [API](/floating/bin_float_result/api), [Tutorial](/floating/bin_float_result/tutorial), [Design](/floating/bin_float_result/design)
- [`decimal_result`](/floating/decimal_result/api): [API](/floating/decimal_result/api), [Tutorial](/floating/decimal_result/tutorial), [Design](/floating/decimal_result/design)
- [`ball_float_result`](/floating/ball_float_result/api): [API](/floating/ball_float_result/api), [Tutorial](/floating/ball_float_result/tutorial), [Design](/floating/ball_float_result/design)
- [`semantic`](/floating/semantic/api): [API](/floating/semantic/api), [Tutorial](/floating/semantic/tutorial), [Design](/floating/semantic/design)
- [`numeric_expr`](/floating/numeric_expr/api): [API](/floating/numeric_expr/api), [Tutorial](/floating/numeric_expr/tutorial), [Design](/floating/numeric_expr/design)
- [`gda_expr`](/floating/gda_expr/api): [API](/floating/gda_expr/api), [Tutorial](/floating/gda_expr/tutorial), [Design](/floating/gda_expr/design)
- [`internal`](/floating/internal/api): [API](/floating/internal/api), [Tutorial](/floating/internal/tutorial), [Design](/floating/internal/design)

The English tree is the structural source of truth. Chinese and Japanese docs
keep the same Markdown file set and section responsibilities.
