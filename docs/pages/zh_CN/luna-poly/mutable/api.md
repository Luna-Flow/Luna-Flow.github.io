# mutable API

本页描述 `Luna-Flow/luna-poly/mutable` 当前公开接口。该包与 `immut` 暴露同名核心类型，但容器以执行导向为主：setter、`clear` 和 `_inplace` 方法会修改接收者；普通运算符仍返回新值。

精确签名以 `src/mutable/pkg.generated.mbti` 和 `moon info` 为准。

`mutable` 是 `mutable/dense`、`mutable/term`、`mutable/sparse` 和
`mutable/context` 的 facade 包，同时重新导出共享的 `core` 能力 trait，
包括 `UnivariatePolynomial`、`MultivariatePolynomial`、
`ContextualPolynomial`、`HasShape` 和 `MutablePolynomial`。具体多项式类型提供
`Type::ops()`，用于不关心底层存储的函数式泛型算法。

facade 还重新导出 `luna-generic` 的常用代数 trait，包括 `Zero`、`One`、
`AddMonoid`、`MulMonoid`、`Semiring`、`Ring`、`Field` 和 `Num`。
mutable 容器实现与 immut 层相同的 `PolynomialShape` 维度元数据，并提供
对应的 `_checked` 方法用于以 `None` 表达契约失败。

可变上下文多项式委托不可变层的代换语义，并通过 `Luna-Flow/type_theory`
的 `Name` 支持命名替换。`ContextSubstitutionValue` 支持标量替换和同上下文
多项式替换；`eval_partial*` 保留原 `VariableContext`。checked 变体会对
外部变量、重复 assignment、未知名称和不兼容替换多项式上下文返回 `None`。

---

## ExponentVector

`mutable.ExponentVector` 是 `immut.ExponentVector` 的值包装。它本身不提供原地修改，语义与 `immut` 对齐，用来作为 mutable 多元容器的指数键。

### 构造与转换

- `ExponentVector::from_array(values : Array[UInt]) -> ExponentVector`

  从指数数组构造，并应用尾部零删除规则。

- `ExponentVector::one() -> ExponentVector`

  返回单位指数向量。

- `ExponentVector::from_immut(value : @immut.ExponentVector) -> ExponentVector`

  从不可变指数向量包装为 mutable 包的指数向量。

- `to_immut(self : ExponentVector) -> @immut.ExponentVector`

  返回对应的不可变指数向量。

### 查询与更新

`to_array`、`length`、`degree`、`is_one`、`get`、`with_exponent`、`One`、`Mul`、`Eq`、`Compare`、`Hash` 和 `Show` 都委托给 `immut.ExponentVector`。`with_exponent` 返回新指数向量，不会原地修改。

---

## DensePolynomial[A]

`DensePolynomial[A]` 是可变单变量稠密多项式。系数仍按升幂顺序保存，并保持与 `immut.DensePolynomial` 相同的尾部零删除规则。

### 构造、转换与查询

- `DensePolynomial::from_coefficients(values : Array[A]) -> DensePolynomial[A]`

  从升幂系数数组构造可变多项式。

- `DensePolynomial::from_immut(value : @immut.DensePolynomial[A]) -> DensePolynomial[A]`

  从不可变多项式创建独立可变值。

- `to_immut(self : DensePolynomial[A]) -> @immut.DensePolynomial[A]`

  转为不可变多项式。

- `to_coefficients`、`length`、`degree`、`leading_term`、`leading_coefficient`、`coefficient`

  与 `immut.DensePolynomial` 的查询语义一致。

- `DensePolynomial::constant`、`DensePolynomial::variable`、`DensePolynomial::monomial`

  构造常数、变量和单项式。

### 可变操作

- `set_coefficient(self : DensePolynomial[A], power : Int, coefficient : A) -> Unit`

  设置指定幂次系数。必要时扩展系数数组；设置为零后会重新删除尾部零。

- `clear(self : DensePolynomial[A]) -> Unit`

  清空为零多项式。

- `copy(self : DensePolynomial[A]) -> DensePolynomial[A]`

  返回独立副本。

- `add_inplace(self : DensePolynomial[A], other : DensePolynomial[A]) -> Unit`

  将 `other` 加到 `self` 上。

- `mul_inplace(self : DensePolynomial[A], other : DensePolynomial[A]) -> Unit`

  用乘积替换 `self`。

- `scale_inplace(self : DensePolynomial[A], power : Int, coefficient : A) -> Unit`

  用 `coefficient * x^power * self` 替换 `self`。

### 返回新值的运算

`+`、`-`、`*`、`scale`、`eval`、`substitute`、`derivative`、`pow`、`karatsuba` 与 `immut` 的数学语义一致，但结果类型是 `mutable.DensePolynomial`。

---

## TermPolynomial[A]

`TermPolynomial[A]` 是可变多元多项式，内部使用规范排序项数组。重复指数合并，零系数项删除。

### 构造、转换与查询

- `TermPolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> TermPolynomial[A]`
- `TermPolynomial::from_array(terms : Array[(Array[UInt], A)]) -> TermPolynomial[A]`
- `TermPolynomial::from_immut(value : @immut.TermPolynomial[A]) -> TermPolynomial[A]`
- `to_immut(self : TermPolynomial[A]) -> @immut.TermPolynomial[A]`
- `to_terms(self : TermPolynomial[A]) -> Array[(ExponentVector, A)]`
- `size(self : TermPolynomial[A]) -> Int`
- `coefficients(self : TermPolynomial[A]) -> Array[A]`

### 可变操作

- `clear(self : TermPolynomial[A]) -> Unit`

  清空所有项。

- `copy(self : TermPolynomial[A]) -> TermPolynomial[A]`

  返回独立副本。

- `add_term_inplace(self : TermPolynomial[A], exponent : ExponentVector, coefficient : A) -> Unit`

  添加一项并重新规范化。

- `add_inplace(self : TermPolynomial[A], other : TermPolynomial[A]) -> Unit`

  将 `other` 的所有项加到 `self`。

- `mul_inplace(self : TermPolynomial[A], other : TermPolynomial[A]) -> Unit`

  用乘积替换 `self`。

- `scale_inplace(self : TermPolynomial[A], exponent : ExponentVector, coefficient : A) -> Unit`

  用乘以单项式后的结果替换 `self`。

### 返回新值的运算

`+`、`-`、`*`、`scale`、`eval` 和 `pow` 返回新值或普通查询结果，不修改接收者。使用 `SparsePolynomial::from_terms(term.to_terms())` 显式转换到稀疏表示。

---

## SparsePolynomial[A]

`SparsePolynomial[A]` 是可变多元稀疏多项式，内部使用 `SortedMap[ExponentVector, A]`。

### 构造、转换与查询

- `SparsePolynomial::new() -> SparsePolynomial[A]`
- `SparsePolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> SparsePolynomial[A]`
- `SparsePolynomial::from_array(terms : Array[(Array[UInt], A)]) -> SparsePolynomial[A]`
- `SparsePolynomial::from_immut(value : @immut.SparsePolynomial[A]) -> SparsePolynomial[A]`
- `to_immut(self : SparsePolynomial[A]) -> @immut.SparsePolynomial[A]`
- `to_terms(self : SparsePolynomial[A]) -> Array[(ExponentVector, A)]`
- `size(self : SparsePolynomial[A]) -> Int`
- `is_empty(self : SparsePolynomial[A]) -> Bool`
- `get(self : SparsePolynomial[A], exponent : ExponentVector) -> A?`

### 可变操作

- `set_coefficient(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> Unit`

  设置指定指数项。系数为零时删除该项。

- `clear(self : SparsePolynomial[A]) -> Unit`

  清空映射。

- `copy(self : SparsePolynomial[A]) -> SparsePolynomial[A]`

  返回独立副本。

- `add_term_inplace(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> Unit`

  添加或合并一项；若合并后为零则删除。

- `add_inplace(self : SparsePolynomial[A], other : SparsePolynomial[A]) -> Unit`

  原地加上另一个稀疏多项式。

- `mul_inplace(self : SparsePolynomial[A], other : SparsePolynomial[A]) -> Unit`

  用乘积替换 `self`。

- `scale_inplace(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> Unit`

  用乘以单项式后的结果替换 `self`。

### 返回新值的运算

`+`、`-`、`*`、`scale`、`eval` 和 `pow` 与 `immut` 语义一致。`Eq` 通过规范项数组比较。使用 `TermPolynomial::from_terms(sparse.to_terms())` 显式转换到排序项数组表示。

---

## VariableContext 和 ContextPolynomial[A]

`mutable` 重导出 `immut.Variable` 和 `immut.VariableContext`，因此两个执行模型共享同一套变量身份。

`mutable.ContextPolynomial[A]` 是 `immut.ContextPolynomial[A]` 的可变包装。

- `from_immut` / `to_immut`
- `from_term_polynomial`
- `from_sparse_polynomial`
- `from_named_terms_as_terms` / `from_named_terms_as_terms_checked`
- `from_named_terms_as_sparse` / `from_named_terms_as_sparse_checked`
- `context`、`to_terms`、`to_term_polynomial`、`to_sparse_polynomial`
- `eval`、`eval_named`、`eval_named_checked`
- `add_inplace`、`mul_inplace`、`copy`、`pow`

`+`、`-`、`*` 返回新包装；`_inplace` 方法替换接收者，并在上下文不兼容时 `abort`。
