# immut 教程

`immut` 包适合把多项式当作普通值来传递：构造器复制输入数组，更新和代数运算返回新值，旧值保持不变。

## 单变量稠密多项式

系数使用升幂顺序：

```moonbit
let p = @immut.DensePolynomial::from_coefficients([1, 2, 3])
let q = @immut.DensePolynomial::variable()
let value = p.eval(2)
let composed = p.substitute(q + @immut.DensePolynomial::constant(1))
```

这里 `p` 表示 `1 + 2x + 3x^2`，`value` 为 `17`。`substitute` 不会修改 `p`。

构造器会保持规范形态：

```moonbit
let p = @immut.DensePolynomial::from_coefficients([1, 2, 0, 0])
let coefficients = p.to_coefficients()
```

`coefficients` 为 `[1, 2]`。

## 指数向量

多元多项式使用 `ExponentVector` 描述单项式指数：

```moonbit
let xy2 = @immut.ExponentVector::from_array([1U, 2])
let x = xy2.with_exponent(1, 0)
let degree = xy2.degree()
```

`xy2` 表示 `x * x_1^2`，总次数为 `3`。`x` 是新值，`xy2` 不变。

## 多元排序项数组表示

`TermPolynomial` 从项数组构造，会合并重复指数并删除零系数：

```moonbit
let p = @immut.TermPolynomial::from_array([
  ([1U, 0], 2),
  ([1U], -2),
  ([0U, 1], 3),
])
let value = p.eval([5, 2])
```

前两项指数等价，系数相加后抵消，剩下 `3 * x_1`，因此 `value` 为 `6`。

## 稀疏映射表示

`SparsePolynomial` 用有序映射保存指数到系数的关系，适合按指数查询：

```moonbit
let p = @immut.SparsePolynomial::from_array([
  ([2U], 1),
  ([1U], 2),
  ([], 1),
])
let coeff = p.get(@immut.ExponentVector::from_array([1U]))
let value = p.eval([2])
```

`p` 表示 `x^2 + 2x + 1`，`coeff` 为 `Some(2)`，`value` 为 `9`。

## 选择表示

- 单变量稠密多项式优先使用 `DensePolynomial`。
- 多元多项式需要稳定项数组和批量代数运算时使用 `TermPolynomial`。
- 多元多项式需要按指数查询或映射语义时使用 `SparsePolynomial`。
- 使用 `SparsePolynomial::from_terms(term.to_terms())` 或
  `TermPolynomial::from_terms(sparse.to_terms())` 在两种多元表示之间显式转换。
- 泛型代码不应关心底层存储时，使用 `UnivariatePolynomial`、
  `MultivariatePolynomial`、`ContextualPolynomial` 或 `Type::ops()`。
