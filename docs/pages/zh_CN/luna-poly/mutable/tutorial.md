# mutable 教程

`mutable` 包适合需要显式控制中间分配或需要逐步构造结果的代码。它保留和 `immut` 相同的数学语义，但把修改操作集中在 setter、`clear` 和 `_inplace` 方法上。

## 单变量稠密多项式

```moonbit
let p = @mutable.DensePolynomial::from_coefficients([1, 2, 3])
let snapshot = p.copy()

p.set_coefficient(1, 5)
p.add_inplace(@mutable.DensePolynomial::from_coefficients([-1, -5, -3]))
```

`snapshot` 仍表示 `1 + 2x + 3x^2`。`p` 先变成 `1 + 5x + 3x^2`，再与相反多项式相加并规范化为零多项式。

普通运算符不会修改接收者：

```moonbit
let p = @mutable.DensePolynomial::from_coefficients([1, 2])
let q = p * p
let unchanged = p.to_coefficients()
```

`q` 是新多项式，`unchanged` 仍为 `[1, 2]`。

## 与 immut 转换

```moonbit
let imm = @immut.DensePolynomial::from_coefficients([1, 0, 1])
let mut_poly = @mutable.DensePolynomial::from_immut(imm)
mut_poly.set_coefficient(0, 2)
let back = mut_poly.to_immut()
```

转换得到的是独立值。修改 `mut_poly` 不会影响 `imm`。

## 多元项数组表示

`TermPolynomial` 适合批量追加项后统一规范化：

```moonbit
let p = @mutable.TermPolynomial::from_array([([1U], 2)])
p.add_term_inplace(@mutable.ExponentVector::from_array([1U, 0]), -2)
let is_zero = p.size() == 0
```

两个指数规范化后相同，系数抵消，因此 `is_zero` 为 `true`。

## 稀疏映射表示

`SparsePolynomial` 适合按指数更新系数：

```moonbit
let x = @mutable.ExponentVector::from_array([1U])
let p = @mutable.SparsePolynomial::new()
p.set_coefficient(x, 3)
p.add_term_inplace(x, -1)
let coeff = p.get(x)
```

`coeff` 为 `Some(2)`。如果把系数设置为零，对应项会从映射中删除。

## 使用建议

- 只在确实需要修改接收者时使用 `_inplace`。
- 如果代码更关注等式推导、回溯或共享旧值，优先使用 `immut`。
- 在 API 边界上使用 `to_immut` / `from_immut` 明确隔离可变状态。
