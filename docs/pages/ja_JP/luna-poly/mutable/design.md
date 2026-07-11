# mutable 設計

`mutable` は `luna-poly` の実行指向層です。`immut` の数学的意味と正規化規則を再利用しながら、明示的に変更するコンテナ操作を公開します。

## 責務

- `mutable` facade を通じて共有 `core` 能力 trait を再エクスポートする。
- `immut` と対応する `DensePolynomial`、`TermPolynomial`、`SparsePolynomial`、`ExponentVector` を提供する。
- `from_immut` と `to_immut` の変換を提供する。
- 段階的な構築と更新のために setter、`clear`、`copy`、`_inplace` 操作を提供する。
- 通常の代数演算子は非変更操作として保つ。

## 変更境界

レシーバを変更する公開メソッドは次の通りです。

- `DensePolynomial::set_coefficient`
- `DensePolynomial::clear`
- `DensePolynomial::add_inplace`
- `DensePolynomial::mul_inplace`
- `DensePolynomial::scale_inplace`
- `TermPolynomial::clear`
- `TermPolynomial::add_term_inplace`
- `TermPolynomial::add_inplace`
- `TermPolynomial::mul_inplace`
- `TermPolynomial::scale_inplace`
- `SparsePolynomial::set_coefficient`
- `SparsePolynomial::clear`
- `SparsePolynomial::add_term_inplace`
- `SparsePolynomial::add_inplace`
- `SparsePolynomial::mul_inplace`
- `SparsePolynomial::scale_inplace`

その他の通常の演算子や `scale`、`pow`、`substitute` などは新しい値を返します。

## immut との関係

多くの可変操作は `immut` に変換して実装を再利用し、その後 mutable 表現に戻します。これにより次の点が一致します。

- 一変数多項式の末尾ゼロ削除。
- 指数ベクトルの正規化と総次数の意味。
- 多変数項の結合とゼロ項削除。
- 自然数冪と `arithmetic.PowNatChecked`。

`mutable.ExponentVector` は `immut.ExponentVector` のラッパーです。安定したキーとして使えるよう、値セマンティクスのままです。

## 正規形

変更操作は戻る前に正規形を復元しなければなりません。

- `DensePolynomial` は末尾ゼロ係数を削除する。
- `TermPolynomial` は重複項を結合し、ゼロ係数を削除する。
- `SparsePolynomial` は係数がゼロになったマップ項を削除する。

新しい原地操作を追加する場合も、これらの不変条件を守る必要があります。

## 使用境界

既定では `immut` を優先します。`mutable` は段階的な更新、明示的な中間値削減、既存の可変アルゴリズムとの接続が必要な場合に使います。

汎用コードは具体的な可変保存形式を照合するのではなく、
`UnivariatePolynomial`、`MultivariatePolynomial`、`ContextualPolynomial`、
`MutablePolynomial`、または対応する `Type::ops()` レコードに依存します。
