# immut チュートリアル

`immut` は多項式を通常の値として扱いたい場合に使います。コンストラクタは入力配列をコピーし、更新は新しい値を返し、古い値は変わりません。

## 一変数密多項式

```moonbit
let p = @immut.DensePolynomial::from_coefficients([1, 2, 3])
let q = @immut.DensePolynomial::variable()
let value = p.eval(2)
let composed = p.substitute(q + @immut.DensePolynomial::constant(1))
```

`p` は `1 + 2x + 3x^2` を表し、`value` は `17` です。`substitute` は `p` を変更しません。

正規形は構築時に保たれます。

```moonbit
let p = @immut.DensePolynomial::from_coefficients([1, 2, 0, 0])
let coefficients = p.to_coefficients()
```

`coefficients` は `[1, 2]` です。

## 指数ベクトル

```moonbit
let xy2 = @immut.ExponentVector::from_array([1U, 2])
let x = xy2.with_exponent(1, 0)
let degree = xy2.degree()
```

`xy2` は `x * x_1^2` を表し、総次数は `3` です。`x` は新しい値です。

## 多変数の項配列表現

```moonbit
let p = @immut.TermPolynomial::from_array([
  ([1U, 0], 2),
  ([1U], -2),
  ([0U, 1], 3),
])
let value = p.eval([5, 2])
```

最初の 2 項は同じ指数に正規化されて打ち消し合います。残る項は `3 * x_1` なので、`value` は `6` です。

## 疎なマップ表現

```moonbit
let p = @immut.SparsePolynomial::from_array([
  ([2U], 1),
  ([1U], 2),
  ([], 1),
])
let coeff = p.get(@immut.ExponentVector::from_array([1U]))
let value = p.eval([2])
```

`p` は `x^2 + 2x + 1` を表します。`coeff` は `Some(2)`、`value` は `9` です。

## 表現の選び方

- 一変数密多項式には `DensePolynomial` を使います。
- 多変数項を順に処理する場合は `TermPolynomial` を使います。
- 指数による検索が重要な場合は `SparsePolynomial` を使います。
- `SparsePolynomial::from_terms(term.to_terms())` または
  `TermPolynomial::from_terms(sparse.to_terms())` で 2 つの多変数表現を明示的に変換します。
- 汎用コードが下位表現を意識すべきでない場合は
  `UnivariatePolynomial`、`MultivariatePolynomial`、`ContextualPolynomial`、
  または `Type::ops()` を使います。
