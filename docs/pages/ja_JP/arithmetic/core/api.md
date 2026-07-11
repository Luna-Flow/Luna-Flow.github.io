# core API

## 役割

`arithmetic` は `luna-generic` の上に解析 capability を積み増します。
平方根、対数、三角関数などの traits と、checked/contextual 算術境界を
定義するのが責務です。

## Unchecked capability traits

- `Sqrt`、`Cbrt`、`Radical`
- `Exponential`
- `Logarithmic`
- `Power`
- `Trigonometric`、`InverseTrigonometric`
- `Hyperbolic`、`InverseHyperbolic`
- `Constants`

これらは `src/elementary.mbt` にあります。

## Checked / contextual surface

### 共有型

- `FpClass`
- `RoundingMode`
- `ArithmeticContext`
- `ArithmeticErrorKind`
- `ArithmeticError`

### Checked traits

- `SqrtChecked`
- `DivChecked`
- `CompareChecked`
- `PowNatChecked`
- `PowIntChecked`
- `ParseChecked`

### Enclosure 関係

- `Contains`
- `Overlaps`
- `DefinitelyLt`
- `DefinitelyLe`
- `MaybeEq`

これらは `src/checked.mbt` にあります。

## 同梱インスタンス

- `Float` と `Double` は `Kaida-Amethyst/math` を通じて広い elementary
  surface を実装します。
- `Float` と `Double` は `sqrt_checked`、`div_checked`、`compare_checked`、
  `pow_nat_checked`、`pow_int_checked` も実装します。
- `BigInt` と整数族は閉じた正確部分集合、特に整数 `Power` を実装します。

## 意味論メモ

- unchecked traits の定義域や branch は具体インスタンス依存です。
- checked traits もインスタンスごとの数学的な定義域に従います。
  `SqrtChecked` は、すべての実装に実数順序やゼロとの比較を要求しません。
- `DivChecked` も NaN や infinity のような浮動小数点概念を要求しません。
  不正な除算は具体インスタンスの数学的な定義域で決まります。
- 同梱の `Float` と `Double` の checked 平方根は既定の実数値インスタンスなので、
  負の実数入力では `DomainError` を返します。
- 同梱の `Float` と `Double` の checked 除算は `0 / 0` と
  `infinity / infinity` を `DomainError` に分類し、非ゼロ値のゼロ除算は
  `DivisionByZero` のまま扱います。
- 符号付き整数と `BigInt` に対する `Power` は非負指数を要求し、負指数は
  実行時 abort になります。
- `ArithmeticContext::new` は precision を最低 `1` に補正します。
- `PowNatChecked` は `x^0` を乗法単位元として扱い、`0^0` も含みます。
- enclosure traits は関係であり、全順序ではありません。
