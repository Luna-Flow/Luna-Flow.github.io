# FLOATING 文档

本目录描述当前 **`0.4.1`** 实现。历史版本说明统一收录在
[CHANGELOG.md](https://github.com/Luna-Flow/floating/blob/main/CHANGELOG.md)，README 只说明当前基线。

## 阅读路径

- 需要具体数值类型时，从 `bin_float`、`decimal` 或 `ball_float` 开始。
- 需要让 checked 算术在链式调用中保持闭合时，使用对应的 `*_result` 包。
- 需要跨表示的精确公共边界时，阅读 `semantic`。
- 构建数值表达式前端时阅读 `numeric_expr`；处理 GDA `.decTest` 与 Decimal
  一致性测试时阅读 `gda_expr`。
- `internal` 与 `consistency` 属于实现和验证层，不是稳定的应用层接口。

## 核心文档

- [文档标准](/zh_CN/floating/doc-standard)
- [正确性审计](/zh_CN/floating/correctness_audit)
- [版本历史](https://github.com/Luna-Flow/floating/blob/main/CHANGELOG.md)
- [一致性测试流程](https://github.com/Luna-Flow/floating/blob/main/testdata/decimal/README.md)

## 包文档

- [`def`](/zh_CN/floating/def/api)：[API](/zh_CN/floating/def/api)、[教程](/zh_CN/floating/def/tutorial)、[设计](/zh_CN/floating/def/design)
- [`bin_float`](/zh_CN/floating/bin_float/api)：[API](/zh_CN/floating/bin_float/api)、[教程](/zh_CN/floating/bin_float/tutorial)、[设计](/zh_CN/floating/bin_float/design)
- [`decimal`](/zh_CN/floating/decimal/api)：[API](/zh_CN/floating/decimal/api)、[教程](/zh_CN/floating/decimal/tutorial)、[设计](/zh_CN/floating/decimal/design)、[架构研究](/floating/decimal/architecture_research)
- [`ball_float`](/zh_CN/floating/ball_float/api)：[API](/zh_CN/floating/ball_float/api)、[教程](/zh_CN/floating/ball_float/tutorial)、[设计](/zh_CN/floating/ball_float/design)
- [`bin_float_result`](/zh_CN/floating/bin_float_result/api)：[API](/zh_CN/floating/bin_float_result/api)、[教程](/zh_CN/floating/bin_float_result/tutorial)、[设计](/zh_CN/floating/bin_float_result/design)
- [`decimal_result`](/zh_CN/floating/decimal_result/api)：[API](/zh_CN/floating/decimal_result/api)、[教程](/zh_CN/floating/decimal_result/tutorial)、[设计](/zh_CN/floating/decimal_result/design)
- [`ball_float_result`](/zh_CN/floating/ball_float_result/api)：[API](/zh_CN/floating/ball_float_result/api)、[教程](/zh_CN/floating/ball_float_result/tutorial)、[设计](/zh_CN/floating/ball_float_result/design)
- [`semantic`](/zh_CN/floating/semantic/api)：[API](/zh_CN/floating/semantic/api)、[教程](/zh_CN/floating/semantic/tutorial)、[设计](/zh_CN/floating/semantic/design)
- [`numeric_expr`](/zh_CN/floating/numeric_expr/api)：[API](/zh_CN/floating/numeric_expr/api)、[教程](/zh_CN/floating/numeric_expr/tutorial)、[设计](/zh_CN/floating/numeric_expr/design)
- [`gda_expr`](/zh_CN/floating/gda_expr/api)：[API](/zh_CN/floating/gda_expr/api)、[教程](/zh_CN/floating/gda_expr/tutorial)、[设计](/zh_CN/floating/gda_expr/design)
- [`internal`](/zh_CN/floating/internal/api)：[API](/zh_CN/floating/internal/api)、[教程](/zh_CN/floating/internal/tutorial)、[设计](/zh_CN/floating/internal/design)

英文目录是结构基准；中文和日文目录保持相同的 Markdown 文件集合与文体职责。
