# immut API

本页描述 `Luna-Flow/luna-poly/immut` 当前公开接口。该包提供值语义多项式容器：所有构造器都会复制输入数组，所有代数操作都会返回新值，原对象不会被修改。

精确签名以 `src/immut/pkg.generated.mbti` 和 `moon info` 为准。

`immut` 是 `immut/dense`、`immut/term`、`immut/sparse` 和
`immut/context` 的 facade 包，同时重新导出 `core` 的能力 trait：
`HasLength`、`HasDegree`、`IsZero`、`HasTermCount`、`HasArity`、
`HasTotalDegree`、`HasContext`、`HasShape`、`UnivariatePolynomial`、
`MultivariatePolynomial` 和 `ContextualPolynomial`。具体多项式类型提供
`Type::ops()`，用于不关心底层存储的函数式泛型算法。

facade 还重新导出 `luna-generic` 的常用代数 trait，包括 `Zero`、`One`、
`AddMonoid`、`MulMonoid`、`Semiring`、`Ring`、`Field` 和 `Num`。
`PolynomialShape` 提供类似线性代数库的维度描述：单变量长度、多变量
arity/项数，以及带变量上下文的兼容性信息。带 `_checked` 后缀的方法在
契约失败时返回 `None`，短方法保持既有的中止行为。

上下文多项式还通过 `Luna-Flow/type_theory` 的 `Name` 接入统一命名语义。
`ContextSubstitutionValue` 支持把变量替换为标量或同一上下文中的多项式；
`eval_partial*` 是标量替换的部分求值形式。部分求值保留原
`VariableContext`，不会自动压缩变量域。代换是同时的一次性操作，插入的
替换多项式不会在同一次调用中继续被替换。checked 变体会对外部变量、
重复替换、未知 `type_theory` 名称和不兼容上下文返回 `None`。

---

## ExponentVector

`ExponentVector` 表示多元单项式的指数向量，例如 `[2, 0, 1]` 表示 `x^2 * x_2`。它会删除尾部零指数，并缓存总次数。

### 构造与查询

- `ExponentVector::from_array(values : Array[UInt]) -> ExponentVector`

  从指数数组构造规范指数向量。尾部零会被删除，输入数组会被复制。

- `ExponentVector::one() -> ExponentVector`

  返回乘法单位元，即空指数向量。

- `length(self : ExponentVector) -> Int`

  返回规范化后的存储长度，不包含尾部零。

- `degree(self : ExponentVector) -> UInt`

  返回所有指数之和。

- `is_one(self : ExponentVector) -> Bool`

  判断是否为单位指数向量。

- `get(self : ExponentVector, index : Int) -> UInt`

  支持 `v[i]` 语法。超出当前长度的非负索引返回 `0`，负索引会中止。

- `with_exponent(self : ExponentVector, index : Int, value : UInt) -> ExponentVector`

  返回指定位置指数被替换后的新向量，并重新规范化。

- `to_array(self : ExponentVector) -> Array[UInt]`

  返回指数数组副本。

### 实现的能力

`ExponentVector` 实现 `One`、`Mul`、`Eq`、`Compare`、`Hash` 和 `Show`。乘法按位置相加指数；比较先按总次数，再按较高变量索引到较低变量索引比较。

---

## DensePolynomial[A]

`DensePolynomial[A]` 表示单变量稠密多项式。公开输入输出使用升幂系数数组：`[1, 2, 3]` 表示 `1 + 2x + 3x^2`。内部使用 core immutable vector 保存规范系数；构造和运算后都会删除尾部零系数，零多项式存成空向量。

### 构造与查询

- `DensePolynomial::from_coefficients(values : Array[A]) -> DensePolynomial[A]`

  从升幂系数数组构造多项式，要求 `A : Eq + Zero`。代数运算只追加实际使用的能力；精确约束以 `moon info` 生成接口为准。

- `DensePolynomial::constant(value : A) -> DensePolynomial[A]`

  构造常数多项式。

- `DensePolynomial::variable() -> DensePolynomial[A]`

  构造变量 `x`。

- `DensePolynomial::monomial(power : Int, coefficient : A) -> DensePolynomial[A]`

  构造 `coefficient * x^power`。`power` 必须非负；零系数返回零多项式。

- `to_coefficients(self : DensePolynomial[A]) -> Array[A]`

  返回系数数组副本。

- `length(self : DensePolynomial[A]) -> Int`

  返回规范化后的系数数量。

- `degree(self : DensePolynomial[A]) -> Int?`

  返回次数；零多项式返回 `None`。

- `coefficient(self : DensePolynomial[A], power : Int) -> A`

  读取指定幂次的系数。超出当前长度返回零；负幂次会中止。

- `leading_term(self : DensePolynomial[A]) -> (Int, A)?`

  返回最高次项的幂次和系数。

- `leading_coefficient(self : DensePolynomial[A]) -> A?`

  返回最高次系数。

### 运算

- `+`、`-`、`*`

  分别执行多项式加法、减法和卷积乘法。

- `scale(self : DensePolynomial[A], power : Int, coefficient : A) -> DensePolynomial[A]`

  返回 `coefficient * x^power * self`。

- `eval(self : DensePolynomial[A], value : A) -> A`

  使用 Horner 形式求值。

- `substitute(self : DensePolynomial[A], value : DensePolynomial[A]) -> DensePolynomial[A]`

  将变量 `x` 替换为另一个多项式。

- `derivative(self : DensePolynomial[A]) -> DensePolynomial[A]`

  返回形式导数，要求系数类型支持 `NatHomomorphism`。

- `pow(self : DensePolynomial[A], exponent : UInt) -> DensePolynomial[A]`

  使用自然数幂计算，并实现 `arithmetic.PowNatChecked`。

- `karatsuba(self : DensePolynomial[A], other : DensePolynomial[A]) -> DensePolynomial[A]`

  Karatsuba 乘法。当前实现对较短输入回退到普通乘法。

---

## TermPolynomial[A]

`TermPolynomial[A]` 表示多元多项式，内部使用 core immutable vector 保存规范化的排序项序列。每一项是 `(ExponentVector, A)`；重复指数会合并，零系数项会删除。

### 构造与查询

- `TermPolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> TermPolynomial[A]`

  从项数组构造多元多项式，合并重复指数并删除零系数。

- `TermPolynomial::from_array(terms : Array[(Array[UInt], A)]) -> TermPolynomial[A]`

  从普通指数数组构造项数组；每个指数数组会先转成 `ExponentVector`。

- `to_terms(self : TermPolynomial[A]) -> Array[(ExponentVector, A)]`

  返回规范项数组副本。

- `size(self : TermPolynomial[A]) -> Int`

  返回非零项数量。

- `coefficients(self : TermPolynomial[A]) -> Array[A]`

  返回当前项顺序下的系数数组。

### 运算

- `+`、`-`、`*`

  加法会拼接后重新规范化；乘法会组合所有项并重新规范化。

- `scale(self : TermPolynomial[A], exponent : ExponentVector, coefficient : A) -> TermPolynomial[A]`

  返回乘以单项式后的新多项式。零系数返回零多项式。

- `eval(self : TermPolynomial[A], values : Array[A]) -> A`

  用变量值数组求值。若某项需要的变量索引超过 `values` 长度，会中止。

- `pow(self : TermPolynomial[A], exponent : UInt) -> TermPolynomial[A]`

  自然数幂，并实现 `arithmetic.PowNatChecked`。

显式使用 `SparsePolynomial::from_terms(term.to_terms())` 转为有序映射表示。

---

## SparsePolynomial[A]

`SparsePolynomial[A]` 也表示多元多项式，但内部使用 `SortedMap[ExponentVector, A]`。它适合按指数查询或需要映射语义的场景。

### 构造与查询

- `SparsePolynomial::new() -> SparsePolynomial[A]`

  构造空稀疏多项式。

- `SparsePolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> SparsePolynomial[A]`

  从项数组构造并规范化。

- `SparsePolynomial::from_array(terms : Array[(Array[UInt], A)]) -> SparsePolynomial[A]`

  从普通指数数组构造。

- `to_terms(self : SparsePolynomial[A]) -> Array[(ExponentVector, A)]`

  返回有序映射中的项数组。

- `size(self : SparsePolynomial[A]) -> Int`

  返回非零项数量。

- `is_empty(self : SparsePolynomial[A]) -> Bool`

  判断是否为空多项式。

- `get(self : SparsePolynomial[A], exponent : ExponentVector) -> A?`

  读取指定指数项的系数。

- `add_term(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> SparsePolynomial[A]`

  返回添加一项并重新规范化后的新值。

显式使用 `TermPolynomial::from_terms(sparse.to_terms())` 转为排序项数组表示。

### 运算

`SparsePolynomial` 实现 `Zero`、`One`、`Add`、`Neg`、`Sub`、`Mul`、`Eq`、`Show` 和 `arithmetic.PowNatChecked`。

- `scale(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> SparsePolynomial[A]`

  返回乘以单项式后的新稀疏多项式。

- `eval(self : SparsePolynomial[A], values : Array[A]) -> A`

  通过 `TermPolynomial` 的求值语义计算结果。

- `pow(self : SparsePolynomial[A], exponent : UInt) -> SparsePolynomial[A]`

  自然数幂。

---

## VariableContext 和 ContextPolynomial[A]

`Variable` 与 `VariableContext` 是命名变量层。变量名在同一个上下文内唯一，每个变量都有稳定的上下文内索引。

- `VariableContext::new`
- `VariableContext::from_names` / `from_names_checked`
- `extend` / `extend_checked`
- `variable` / `require_variable`
- `contains`、`size`、`variables`、`get`
- `Variable::name`、`Variable::index`

`ContextPolynomial[A]` 把 `VariableContext` 绑定到排序项或稀疏存储。

- `from_term_polynomial`
- `from_sparse_polynomial`
- `from_named_terms_as_terms` / `from_named_terms_as_terms_checked`
- `from_named_terms_as_sparse` / `from_named_terms_as_sparse_checked`
- `context`、`to_terms`、`to_term_polynomial`、`to_sparse_polynomial`
- `eval`、`eval_named`、`eval_named_checked`
- `add_checked`、`mul_checked`、`pow`

checked 接口在变量不属于上下文、命名赋值重复或缺失、上下文不兼容时返回 `None`；便捷接口在同样情况下 `abort`。
