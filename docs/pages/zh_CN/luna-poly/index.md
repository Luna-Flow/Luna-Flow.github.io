# Luna-Flow/luna-poly 0.2.0

本库由一个共享能力层和两种执行模型组成：

- `core` 提供共享类型、能力 trait 和函数式操作记录。
- `immut` 提供持久化值语义，更新返回新值。
- `mutable` 提供 setter 与命名清晰的 `_inplace` 原地操作。

具体实现位于镜像子包：`immut/dense`、`immut/term`、`immut/sparse`、
`immut/context`，以及 `mutable/dense`、`mutable/term`、`mutable/sparse`、
`mutable/context`。顶层 `immut` 和 `mutable` 是 facade 包，会重新导出
`core` 能力和对应实现。

两个 facade 包都提供单变量稠密多项式、排序项数组多元多项式、有序映射稀疏多项式及指数向量。它们共享规范形态和自然数幂语义。泛型算法可以依赖 `UnivariatePolynomial`、`MultivariatePolynomial`、`ContextualPolynomial`、`MutablePolynomial` 或 `Type::ops()`，而不必关心底层存储。

`0.2.0` 还新增命名变量层：`Variable`、`VariableContext` 和 `ContextPolynomial`。上下文多项式把变量表绑定到排序项或稀疏存储，同时支持按索引数组求值和按变量赋值求值。当前 API 以根 README 与 `moon info` 生成的包接口为准。

## 包文档

- `immut/api.md`：`DensePolynomial`、`TermPolynomial`、`SparsePolynomial` 和 `ExponentVector` 的值语义 API。
- `immut/tutorial.md`：不可变稠密、多元和稀疏多项式示例。
- `immut/design.md`：规范形态和表示不变量。
- `mutable/api.md`：可变 API，包括 setter 和 `_inplace` 方法。
- `mutable/tutorial.md`：原地更新和 `immut` 转换示例。
- `mutable/design.md`：可变性边界，以及与 `immut` 的语义对齐。
