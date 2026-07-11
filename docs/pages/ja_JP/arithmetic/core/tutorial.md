# core チュートリアル

## 汎用解析 helper

```moonbit
fn hypot2[T : Add + Mul + Sqrt](x : T, y : T) -> T {
  (x * x + y * y).sqrt()
}
```

この書き方なら、アルゴリズムが本当に必要とする解析 capability だけを
明示できます。

## Checked 除法

```moonbit
fn safe_ratio[T : DivChecked](x : T, y : T) -> Result[T, ArithmeticError] {
  x.div_checked(y, ArithmeticContext::new(32))
}
```

ゼロ除算、定義域、精度依存の失敗を API 境界で明示したいなら checked 層を
使ってください。

## Checked 比較

```moonbit
fn ordering_or_error[T : CompareChecked](lhs : T, rhs : T) -> Result[Int, ArithmeticError] {
  lhs.compare_checked(rhs)
}
```

NaN などを勝手に全順序へ落とし込んではいけない場面に向いています。

## 実践ガイド

- 直接的な後端意味論で十分なときだけ unchecked traits を使う。
- API 境界では checked traits を優先する。
- 代数構造は `luna-generic`、解析 capability は `arithmetic` に置く。
