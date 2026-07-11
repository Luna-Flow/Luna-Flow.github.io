# mutable チュートリアル

`mutable` は中間確保を明示的に制御したい場合や、段階的に結果を構築したい場合に使います。数学的な意味は `immut` と一致しますが、変更は setter、`clear`、`_inplace` メソッドに限定されます。

## 一変数密多項式

```moonbit
let p = @mutable.DensePolynomial::from_coefficients([1, 2, 3])
let snapshot = p.copy()

p.set_coefficient(1, 5)
p.add_inplace(@mutable.DensePolynomial::from_coefficients([-1, -5, -3]))
```

`snapshot` は `1 + 2x + 3x^2` のままです。`p` は更新され、その後ゼロ多項式に正規化されます。

通常の演算子はレシーバを変更しません。

```moonbit
let p = @mutable.DensePolynomial::from_coefficients([1, 2])
let q = p * p
let unchanged = p.to_coefficients()
```

`q` は新しい多項式で、`unchanged` は `[1, 2]` です。

## immut との変換

```moonbit
let imm = @immut.DensePolynomial::from_coefficients([1, 0, 1])
let mut_poly = @mutable.DensePolynomial::from_immut(imm)
mut_poly.set_coefficient(0, 2)
let back = mut_poly.to_immut()
```

変換結果は独立した値です。

## 多変数の項配列表現

```moonbit
let p = @mutable.TermPolynomial::from_array([([1U], 2)])
p.add_term_inplace(@mutable.ExponentVector::from_array([1U, 0]), -2)
let is_zero = p.size() == 0
```

2 つの指数ベクトルは同じキーに正規化されるため、項は打ち消し合います。

## 疎なマップ表現

```moonbit
let x = @mutable.ExponentVector::from_array([1U])
let p = @mutable.SparsePolynomial::new()
p.set_coefficient(x, 3)
p.add_term_inplace(x, -1)
let coeff = p.get(x)
```

`coeff` は `Some(2)` です。係数をゼロに設定すると、その項は削除されます。

## 指針

- レシーバを変更する意図が明確な場合だけ `_inplace` を使います。
- 古い値の共有に依存するコードでは `immut` を優先します。
- API 境界では `to_immut` と `from_immut` を使い、可変状態を隔離します。
