# mutable 包设计

`mutable` 是 `luna-poly` 的执行导向层。它复用 `immut` 的数学语义和规范化规则，但允许调用者通过明确命名的方法修改容器。

## 职责

- 通过 `mutable` facade 重新导出共享的 `core` 能力 trait。
- 提供与 `immut` 对齐的 `DensePolynomial`、`TermPolynomial`、`SparsePolynomial` 和 `ExponentVector`。
- 提供 `from_immut` / `to_immut`，让可变表示和不可变表示可以在包边界转换。
- 提供 setter、`clear`、`copy` 和 `_inplace` 方法，支持逐步构造和原地更新。
- 保持普通代数运算符的非原地语义。

## 可变性边界

可修改接收者的公开方法包括：

- `DensePolynomial::set_coefficient`
- `DensePolynomial::clear`
- `DensePolynomial::add_inplace`
- `DensePolynomial::mul_inplace`
- `DensePolynomial::scale_inplace`
- `TermPolynomial::clear`
- `TermPolynomial::add_term_inplace`
- `TermPolynomial::add_inplace`
- `TermPolynomial::mul_inplace`
- `TermPolynomial::scale_inplace`
- `SparsePolynomial::set_coefficient`
- `SparsePolynomial::clear`
- `SparsePolynomial::add_term_inplace`
- `SparsePolynomial::add_inplace`
- `SparsePolynomial::mul_inplace`
- `SparsePolynomial::scale_inplace`

其它普通运算符和 `scale`、`pow`、`substitute` 等方法返回新值，不修改接收者。

## 与 immut 的关系

`mutable` 中大量运算通过转换到 `immut` 后复用实现，再转换回来。这使两层在下列方面保持一致：

- 单变量多项式的尾部零删除规则。
- 多元指数向量的尾部零删除和总次数语义。
- 多元项合并、零项删除和求值语义。
- 自然数幂和 `arithmetic.PowNatChecked` 行为。

`mutable.ExponentVector` 本身是 `immut.ExponentVector` 的包装，并不是可原地修改的向量。它保持值语义，是为了作为可变多项式容器的稳定键。

## 规范形态

可变操作完成后必须恢复规范形态：

- `DensePolynomial::set_coefficient` 和 `_inplace` 运算后删除尾部零。
- `TermPolynomial::add_term_inplace` 通过重新构造合并重复项并删除零项。
- `SparsePolynomial::set_coefficient` 在系数为零时删除映射项。

维护者添加新的原地操作时，必须在返回前恢复这些不变量。

## 使用边界

`mutable` 不应该成为默认接口。默认推荐仍是 `immut`，除非调用者需要：

- 逐步填充或更新多项式。
- 避免显式创建多层中间值。
- 与已有可变算法接口对接。

在跨包或长期保存数据时，优先转成 `immut`，减少可变别名带来的状态推理成本。

泛型代码应依赖 `UnivariatePolynomial`、`MultivariatePolynomial`、
`ContextualPolynomial`、`MutablePolynomial` 或对应的 `Type::ops()` 记录，
而不是匹配具体的可变存储类型。
