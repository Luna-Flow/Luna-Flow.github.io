# immut 設計

`immut` は `luna-poly` の値セマンティクス層です。多項式、指数ベクトル、多変数項集合を正規化済みの値としてモデル化します。

## 責務

- `immut` facade を通じて共有 `core` 能力 trait を再エクスポートする。
- 一変数密多項式 `DensePolynomial[A]` を提供する。
- 多変数指数キー `ExponentVector` を提供する。
- ソート済み項列 `TermPolynomial[A]` と順序付きマップ `SparsePolynomial[A]` の 2 つの多変数表現を提供する。
- 多項式型に通常の代数演算と `arithmetic.PowNatChecked` を実装する。

## 正規形

- `DensePolynomial` は係数を core immutable vector に保存し、末尾ゼロ係数を削除し、ゼロを空ベクトルとして表す。
- `ExponentVector` は指数を core immutable vector に保存し、末尾ゼロ指数を削除し、総次数をキャッシュする。
- `TermPolynomial` は項を core immutable vector に保存し、同じ指数を結合し、ゼロ係数を削除し、項をソート済みに保つ。
- `SparsePolynomial` は非ゼロ項を `SortedMap` に保存し、空マップをゼロとする。

これらの規則は `to_coefficients`、`to_terms`、`size`、`degree`、等価性から観測できます。

## 値セマンティクス

公開コンストラクタは入力配列をコピーします。更新に見える操作は新しい値を返します。

- `ExponentVector::with_exponent`
- `SparsePolynomial::add_term`
- `+`、`-`、`*`、`scale`、`pow`

呼び出し側は演算後も古い値を安全に再利用できます。

## 表現の違い

`TermPolynomial` と `SparsePolynomial` は同じ数学的対象を表しますが、異なるアクセスパターンを重視します。

- `TermPolynomial` は正規化済み項列の順序付き走査と一括の代数演算に向きます。
- `SparsePolynomial` は `ExponentVector` による検索に向きます。
- `SparsePolynomial::from_terms(term.to_terms())` または
  `TermPolynomial::from_terms(sparse.to_terms())` で明示的に変換します。
  変換時には正規化が再適用され、実装サブパッケージ同士の循環依存を避けます。

## 能力境界

共有問い合わせ能力だけが必要なアルゴリズムは、具体表現ではなく
`UnivariatePolynomial`、`MultivariatePolynomial`、`ContextualPolynomial`
に依存します。構築、変換、代数演算も必要な場合は対応する `Type::ops()`
レコードを受け取ります。

## 保守メモ

- 現在のブランチに存在する API だけを文書化する。
- 正規化、項順序、ゼロ処理、評価時の中止条件が変わったらこのページを更新する。
- `mutable` との観測可能な差異は対応する `mutable` ページに記録する。
