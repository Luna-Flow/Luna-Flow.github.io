# core 教程

需要泛型复数构造和代数运算时使用根包。

## 建议流程

1. 导入根包并引入 `Complex`。
2. 使用 `Complex::new(re, im)` 构造复数。
3. 当标量类型实现所需 Luna Flow trait 时，直接使用代数运算符。

## 实用建议

- 普通浮点复数使用 `Complex[Double]`；需要嵌套代数行为时可以使用 `Complex[Complex[Double]]`。
- 只有确实需要原地更新时才使用 `set`、`set_re` 和 `set_im`。
- 超越函数和分支敏感的浮点行为使用 `float_backend`。
