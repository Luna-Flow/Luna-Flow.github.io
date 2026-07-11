# mutable API

このページは `Luna-Flow/luna-poly/mutable` の現在の公開 API を説明します。このパッケージは `immut` と同じ主要型名を公開しますが、コンテナは実行指向です。setter、`clear`、`_inplace` メソッドはレシーバを変更し、通常の演算子は新しい値を返します。

正確なシグネチャは `src/mutable/pkg.generated.mbti` と `moon info` を基準にしてください。

`mutable` は `mutable/dense`、`mutable/term`、`mutable/sparse`、
`mutable/context` の facade パッケージです。`UnivariatePolynomial`、
`MultivariatePolynomial`、`ContextualPolynomial`、`HasShape`、
`MutablePolynomial` など
共有 `core` 能力 trait も再エクスポートします。具体多項式型は
下位表現に依存しない関数型の汎用アルゴリズム向けに `Type::ops()` を提供します。

facade は `luna-generic` の主要な代数 trait (`Zero`、`One`、
`AddMonoid`、`MulMonoid`、`Semiring`、`Ring`、`Field`、`Num`) も
再エクスポートします。mutable コンテナは immut 層と同じ
`PolynomialShape` 次元メタデータを実装し、契約違反を `None` で返す
対応する `_checked` メソッドを提供します。

可変 context 多項式は不可変層の置換意味論に委譲し、
`Luna-Flow/type_theory` の `Name` による名前ベース置換をサポートします。
`ContextSubstitutionValue` はスカラー置換と同一 context 多項式置換を表し、
`eval_partial*` は元の `VariableContext` を保持します。checked 変体は外部
変数、重複 assignment、未知名、不互換な置換多項式 context を `None` として
返します。

---

## ExponentVector

`mutable.ExponentVector` は `immut.ExponentVector` の値ラッパーです。原地変更 API はなく、可変多変数コンテナの指数キーとして使われます。

- `ExponentVector::from_array(values : Array[UInt]) -> ExponentVector`
- `ExponentVector::one() -> ExponentVector`
- `ExponentVector::from_immut(value : @immut.ExponentVector) -> ExponentVector`
- `to_immut(self : ExponentVector) -> @immut.ExponentVector`
- `to_array`、`length`、`degree`、`is_one`、`get`、`with_exponent`

`One`、`Mul`、`Eq`、`Compare`、`Hash`、`Show` は `immut.ExponentVector` に委譲されます。

---

## DensePolynomial[A]

`DensePolynomial[A]` は可変の一変数密多項式です。係数は昇冪順で保存され、末尾ゼロは削除されます。

### 構築、変換、問い合わせ

- `DensePolynomial::from_coefficients(values : Array[A]) -> DensePolynomial[A]`
- `DensePolynomial::from_immut(value : @immut.DensePolynomial[A]) -> DensePolynomial[A]`
- `to_immut(self : DensePolynomial[A]) -> @immut.DensePolynomial[A]`
- `to_coefficients`、`length`、`degree`、`leading_term`、`leading_coefficient`、`coefficient`
- `DensePolynomial::constant`、`DensePolynomial::variable`、`DensePolynomial::monomial`

### 変更操作

- `set_coefficient(self : DensePolynomial[A], power : Int, coefficient : A) -> Unit`

  指定次数の係数を設定し、必要なら配列を拡張し、最後に正規化します。

- `clear(self : DensePolynomial[A]) -> Unit`

  ゼロ多項式に戻します。

- `copy(self : DensePolynomial[A]) -> DensePolynomial[A]`

  独立したコピーを返します。

- `add_inplace`、`mul_inplace`、`scale_inplace`

  レシーバを対応する結果で置き換えます。

### 非変更操作

`+`、`-`、`*`、`scale`、`eval`、`substitute`、`derivative`、`pow`、`karatsuba` は新しい値または問い合わせ結果を返し、レシーバを変更しません。

---

## TermPolynomial[A]

`TermPolynomial[A]` は正規化済みのソート済み項配列を持つ可変多変数多項式です。

- `TermPolynomial::from_terms`
- `TermPolynomial::from_array`
- `TermPolynomial::from_immut`
- `to_immut`
- `to_terms`
- `size`
- `coefficients`
- `clear`
- `copy`
- `add_term_inplace`
- `add_inplace`
- `mul_inplace`
- `scale_inplace`
- `scale`
- `eval`
- `pow`

`_inplace` メソッドはレシーバを変更します。通常の代数演算子は新しい値を返します。
`SparsePolynomial::from_terms(term.to_terms())` で明示的に疎表現へ変換します。

---

## SparsePolynomial[A]

`SparsePolynomial[A]` は `SortedMap[ExponentVector, A]` を使う可変の多変数疎多項式です。

- `SparsePolynomial::new`
- `SparsePolynomial::from_terms`
- `SparsePolynomial::from_array`
- `SparsePolynomial::from_immut`
- `to_immut`
- `to_terms`
- `size`
- `is_empty`
- `get`
- `set_coefficient`
- `clear`
- `copy`
- `add_term_inplace`
- `add_inplace`
- `mul_inplace`
- `scale_inplace`
- `scale`
- `eval`
- `pow`

`set_coefficient` は係数がゼロのとき項を削除します。等価性は正規化済み項配列で比較されます。
`TermPolynomial::from_terms(sparse.to_terms())` で明示的に項列表現へ変換します。

---

## VariableContext と ContextPolynomial[A]

`mutable` は `immut.Variable` と `immut.VariableContext` を再エクスポートするため、両方の実行モデルで同じ変数 identity を共有します。

`mutable.ContextPolynomial[A]` は `immut.ContextPolynomial[A]` の可変ラッパーです。

- `from_immut` / `to_immut`
- `from_term_polynomial`
- `from_sparse_polynomial`
- `from_named_terms_as_terms` / `from_named_terms_as_terms_checked`
- `from_named_terms_as_sparse` / `from_named_terms_as_sparse_checked`
- `context`、`to_terms`、`to_term_polynomial`、`to_sparse_polynomial`
- `eval`、`eval_named`、`eval_named_checked`
- `add_inplace`、`mul_inplace`、`copy`、`pow`

`+`、`-`、`*` は新しいラッパーを返します。`_inplace` メソッドは受信者を置き換え、コンテキストが非互換の場合は `abort` します。
