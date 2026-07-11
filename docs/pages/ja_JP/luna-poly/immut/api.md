# immut API

このページは `Luna-Flow/luna-poly/immut` の現在の公開 API を説明します。このパッケージは値セマンティクスの多項式コンテナを提供します。コンストラクタは入力配列をコピーし、代数演算は新しい値を返し、既存の値を変更しません。

正確なシグネチャは `src/immut/pkg.generated.mbti` と `moon info` を基準にしてください。

`immut` は `immut/dense`、`immut/term`、`immut/sparse`、
`immut/context` の facade パッケージです。また `core` の能力 trait
である `HasLength`、`HasDegree`、`IsZero`、`HasTermCount`、`HasArity`、
`HasTotalDegree`、`HasContext`、`UnivariatePolynomial`、
`HasShape`、`MultivariatePolynomial`、`ContextualPolynomial` を再エクスポートします。
具体多項式型は、下位表現に依存しない関数型の汎用アルゴリズム向けに
`Type::ops()` を提供します。

facade は `luna-generic` の主要な代数 trait (`Zero`、`One`、
`AddMonoid`、`MulMonoid`、`Semiring`、`Ring`、`Field`、`Num`) も
再エクスポートします。`PolynomialShape` は線形代数ライブラリに近い
次元情報を提供し、一変数の長さ、多変数の arity/項数、context 互換性を
扱えます。`_checked` 付きメソッドは契約違反を `None` として返し、短い
便利メソッドは従来どおり中止します。

context 付き多項式は `Luna-Flow/type_theory` の `Name` を通じて共有の
名前付け意味論に接続します。`ContextSubstitutionValue` は変数をスカラー
または同じ context の多項式で置き換えます。`eval_partial*` はスカラー
置換による部分評価で、元の `VariableContext` を保持します。置換は同時
かつ一回限りで、挿入された置換多項式は同じ呼び出し中に再置換されません。
checked 変体は外部変数、重複置換、未知の `type_theory` 名、不互換 context
を `None` として返します。

---

## ExponentVector

`ExponentVector` は多変数単項式の指数ベクトルです。例えば `[2, 0, 1]` は `x^2 * x_2` を表します。末尾のゼロ指数は削除され、総次数はキャッシュされます。

### 構築と問い合わせ

- `ExponentVector::from_array(values : Array[UInt]) -> ExponentVector`

  指数配列から正規化済みの指数ベクトルを作ります。入力配列はコピーされます。

- `ExponentVector::one() -> ExponentVector`

  乗法単位元、つまり空の指数ベクトルを返します。

- `length(self : ExponentVector) -> Int`

  末尾ゼロを除いた保存長を返します。

- `degree(self : ExponentVector) -> UInt`

  すべての指数の和を返します。

- `is_one(self : ExponentVector) -> Bool`

  単位指数ベクトルかどうかを返します。

- `get(self : ExponentVector, index : Int) -> UInt`

  `v[i]` 構文をサポートします。保存長を超える非負インデックスは `0` を返し、負インデックスは中止します。

- `with_exponent(self : ExponentVector, index : Int, value : UInt) -> ExponentVector`

  指定位置の指数を置き換えた新しいベクトルを返し、結果を再正規化します。

- `to_array(self : ExponentVector) -> Array[UInt]`

  指数配列のコピーを返します。

`ExponentVector` は `One`、`Mul`、`Eq`、`Compare`、`Hash`、`Show` を実装します。乗法は指数の位置ごとの加算です。比較は総次数を先に見て、その後高い変数インデックスから低いインデックスへ比較します。

---

## DensePolynomial[A]

`DensePolynomial[A]` は一変数の密多項式です。公開入出力では係数配列を昇冪順に使います。`[1, 2, 3]` は `1 + 2x + 3x^2` を表します。内部では正規化済み係数を core immutable vector に保存します。構築後および演算後には末尾ゼロ係数が削除され、ゼロ多項式は空ベクトルとして保存されます。

### 構築と問い合わせ

- `DensePolynomial::from_coefficients(values : Array[A]) -> DensePolynomial[A]`

  昇冪順の係数配列から多項式を作ります。必要な制約は `A : Eq + Zero` です。代数演算は実際に使う能力だけを追加し、正確な境界は `moon info` の生成インターフェイスに従います。

- `DensePolynomial::constant(value : A) -> DensePolynomial[A]`

  定数多項式を作ります。

- `DensePolynomial::variable() -> DensePolynomial[A]`

  変数 `x` を作ります。

- `DensePolynomial::monomial(power : Int, coefficient : A) -> DensePolynomial[A]`

  `coefficient * x^power` を作ります。`power` は非負でなければなりません。ゼロ係数ならゼロ多項式を返します。

- `to_coefficients`、`length`、`degree`、`coefficient`、`leading_term`、`leading_coefficient`

  正規化済みの係数表現を問い合わせます。範囲外の非負次数の係数はゼロとして読まれます。

### 演算

- `+`、`-`、`*`

  多項式の加算、減算、畳み込み乗算です。

- `scale(self : DensePolynomial[A], power : Int, coefficient : A) -> DensePolynomial[A]`

  `coefficient * x^power * self` を返します。

- `eval(self : DensePolynomial[A], value : A) -> A`

  Horner 形式で評価します。

- `substitute(self : DensePolynomial[A], value : DensePolynomial[A]) -> DensePolynomial[A]`

  変数 `x` を別の多項式で置換します。

- `derivative(self : DensePolynomial[A]) -> DensePolynomial[A]`

  形式微分を返します。係数型は `NatHomomorphism` をサポートする必要があります。

- `pow(self : DensePolynomial[A], exponent : UInt) -> DensePolynomial[A]`

  自然数冪です。`arithmetic.PowNatChecked` も実装します。

- `karatsuba(self : DensePolynomial[A], other : DensePolynomial[A]) -> DensePolynomial[A]`

  Karatsuba 乗算です。小さい入力では通常の乗算に戻ります。

---

## TermPolynomial[A]

`TermPolynomial[A]` は core immutable vector に保存された正規化済みのソート済み項列を持つ多変数多項式です。各項は `(ExponentVector, A)` です。同じ指数は結合され、ゼロ係数項は削除されます。

- `TermPolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> TermPolynomial[A]`
- `TermPolynomial::from_array(terms : Array[(Array[UInt], A)]) -> TermPolynomial[A]`
- `to_terms(self : TermPolynomial[A]) -> Array[(ExponentVector, A)]`
- `size(self : TermPolynomial[A]) -> Int`
- `coefficients(self : TermPolynomial[A]) -> Array[A]`
- `scale(self : TermPolynomial[A], exponent : ExponentVector, coefficient : A) -> TermPolynomial[A]`
- `eval(self : TermPolynomial[A], values : Array[A]) -> A`
- `pow(self : TermPolynomial[A], exponent : UInt) -> TermPolynomial[A]`

`TermPolynomial` は `Zero`、`One`、`Add`、`Neg`、`Sub`、`Mul`、`Show`、`arithmetic.PowNatChecked` を実装します。評価時に必要な変数値が `values` にない場合は中止します。

`SparsePolynomial::from_terms(term.to_terms())` で明示的に疎表現へ変換します。

---

## SparsePolynomial[A]

`SparsePolynomial[A]` は `SortedMap[ExponentVector, A]` を使う別の多変数表現です。指数による検索が必要な場面に向いています。

- `SparsePolynomial::new() -> SparsePolynomial[A]`
- `SparsePolynomial::from_terms(terms : Array[(ExponentVector, A)]) -> SparsePolynomial[A]`
- `SparsePolynomial::from_array(terms : Array[(Array[UInt], A)]) -> SparsePolynomial[A]`
- `to_terms(self : SparsePolynomial[A]) -> Array[(ExponentVector, A)]`
- `size(self : SparsePolynomial[A]) -> Int`
- `is_empty(self : SparsePolynomial[A]) -> Bool`
- `get(self : SparsePolynomial[A], exponent : ExponentVector) -> A?`
- `add_term(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> SparsePolynomial[A]`
- `scale(self : SparsePolynomial[A], exponent : ExponentVector, coefficient : A) -> SparsePolynomial[A]`
- `eval(self : SparsePolynomial[A], values : Array[A]) -> A`
- `pow(self : SparsePolynomial[A], exponent : UInt) -> SparsePolynomial[A]`

`SparsePolynomial` は `Zero`、`One`、`Add`、`Neg`、`Sub`、`Mul`、`Eq`、`Show`、`arithmetic.PowNatChecked` を実装します。

`TermPolynomial::from_terms(sparse.to_terms())` で明示的に項列表現へ変換します。

---

## VariableContext と ContextPolynomial[A]

`Variable` と `VariableContext` は名前付き変数層です。同じコンテキスト内では変数名は一意で、各変数は安定したコンテキスト内インデックスを持ちます。

- `VariableContext::new`
- `VariableContext::from_names` / `from_names_checked`
- `extend` / `extend_checked`
- `variable` / `require_variable`
- `contains`、`size`、`variables`、`get`
- `Variable::name`、`Variable::index`

`ContextPolynomial[A]` は `VariableContext` を項列表現または疎表現に束縛します。

- `from_term_polynomial`
- `from_sparse_polynomial`
- `from_named_terms_as_terms` / `from_named_terms_as_terms_checked`
- `from_named_terms_as_sparse` / `from_named_terms_as_sparse_checked`
- `context`、`to_terms`、`to_term_polynomial`、`to_sparse_polynomial`
- `eval`、`eval_named`、`eval_named_checked`
- `add_checked`、`mul_checked`、`pow`

checked API は、変数がコンテキスト外の場合、名前付き代入が重複または不足する場合、またはコンテキストが非互換の場合に `None` を返します。便宜 API は同じ契約違反で `abort` します。
