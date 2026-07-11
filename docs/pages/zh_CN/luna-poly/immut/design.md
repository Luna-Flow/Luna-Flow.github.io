# immut 包设计

`immut` 是 `luna-poly` 的值语义层。它把多项式、指数向量和多元项集合都建模为规范化值，适合作为普通数据在调用链中传递。

## 职责

- 通过 `immut` facade 重新导出共享的 `core` 能力 trait。
- 提供单变量稠密多项式 `DensePolynomial[A]`。
- 提供多元指数键 `ExponentVector`。
- 提供两种多元多项式表示：排序项序列 `TermPolynomial[A]` 和有序映射 `SparsePolynomial[A]`。
- 为三种多项式实现普通代数运算和 `arithmetic.PowNatChecked`。

## 规范形态

- `DensePolynomial` 使用 core immutable vector 保存系数，删除尾部零系数，零多项式存为空向量。
- `ExponentVector` 使用 core immutable vector 保存指数，删除尾部零指数，并缓存总次数。
- `TermPolynomial` 使用 core immutable vector 保存项序列，合并相同指数项，删除零系数项，并保持内部项排序。
- `SparsePolynomial` 通过 `SortedMap` 保存非零项，空映射表示零多项式。

这些规范化规则是可观察语义的一部分：`to_coefficients`、`to_terms`、`size`、`degree` 和相等性都依赖它们。

## 值语义

所有公开构造器都会复制输入数组。所有更新型操作都返回新值，例如：

- `ExponentVector::with_exponent`
- `SparsePolynomial::add_term`
- 多项式的 `+`、`-`、`*`、`scale`、`pow`

调用者可以安全复用旧值，不需要担心后续操作修改原对象。

## 表示差异

`TermPolynomial` 和 `SparsePolynomial` 描述同一类数学对象，但服务不同访问模式：

- `TermPolynomial` 使用规范项序列，适合顺序遍历和批量代数运算。
- `SparsePolynomial` 使用有序映射，适合按 `ExponentVector` 查询。
- 两者通过 `SparsePolynomial::from_terms(term.to_terms())` 或
  `TermPolynomial::from_terms(sparse.to_terms())` 显式互转，转换时重新应用
  规范化规则，同时避免实现子包相互依赖。

## 能力边界

只需要共享查询能力的算法应该依赖 `UnivariatePolynomial`、
`MultivariatePolynomial` 或 `ContextualPolynomial`，而不是匹配具体存储。
如果算法还需要构造、转换或代数运算，则接收对应类型的 `Type::ops()` 记录。

## 维护约束

- 文档只能记录当前分支已经存在的 API。
- 如果规范化规则、项排序、零值处理或求值中止条件变化，必须同步更新 `api.md` 和 `tutorial.md`。
- 如果 `mutable` 包复用或偏离这些语义，必须在 `mutable/design.md` 中明确说明。
