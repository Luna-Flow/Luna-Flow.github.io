# core チュートリアル

汎用複素数の構築と代数演算が必要なときは、ルートパッケージを使います。

## 推奨フロー

1. ルートパッケージを import し、`Complex` をスコープに入れる。
2. `Complex::new(re, im)` で値を作る。
3. スカラー型が必要な Luna Flow trait を実装している場合、代数演算子を使う。

## 実用上の注意

- 通常の浮動小数点値には `Complex[Double]` を使い、入れ子の代数挙動が必要な場合は `Complex[Complex[Double]]` を使う。
- `set`、`set_re`、`set_im` は、意図的にミューテーションしたい場合だけ使う。
- 超越関数や分岐に敏感な浮動小数点挙動には `float_backend` を使う。
