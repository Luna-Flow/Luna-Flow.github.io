# float_backend 教程

当 `Complex[Double]` 需要解析函数或超越函数时使用 `float_backend`。

## 建议流程

1. 从根包或 `float_backend` 引入 `Complex`。
2. 构造一个 `Complex[Double]`。
3. 调用自由函数，例如 `@float_backend.log(z)`、`@float_backend.sin(z)` 或 `@float_backend.sqrt(z)`。

## 实用建议

- 优先使用本包的自由函数，不要在下游重复实现公式。
- `arg`、`log`、`sqrt` 和反三角函数等分支敏感函数属于本包的可观察契约。
- 只有在编写新的浮点后端代码时才直接使用后端 trait。
