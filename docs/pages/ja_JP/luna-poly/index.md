# Luna-Flow/luna-poly 0.2.0

このライブラリは共有能力レイヤーと 2 つの実行モデルで構成されます。

- `core` は共有型、能力 trait、関数型の操作レコードを提供します。
- `immut` は永続的な値セマンティクスを提供します。
- `mutable` は setter と明示的な `_inplace` 操作を提供します。

具体実装は `immut/dense`、`immut/term`、`immut/sparse`、
`immut/context` と、対応する `mutable/*` サブパッケージにあります。
トップレベルの `immut` と `mutable` は facade パッケージで、`core` の能力と具体実装を再エクスポートします。

両 facade パッケージは単変数密多項式、整列項配列の多変数多項式、順序付きマップの疎多項式、指数ベクトルを公開します。正規形と自然数べきの意味論は共通です。汎用アルゴリズムは `UnivariatePolynomial`、`MultivariatePolynomial`、`ContextualPolynomial`、`MutablePolynomial`、または `Type::ops()` に依存でき、下位表現を意識する必要はありません。

`0.2.0` では名前付き変数層として `Variable`、`VariableContext`、`ContextPolynomial` も追加します。コンテキスト多項式は変数表を項列または疎表現に束縛し、添字配列による評価と変数代入による評価の両方を提供します。現在の API はルート README と `moon info` が生成するインターフェースを参照してください。

## パッケージ文書

- `immut/api.md`: `DensePolynomial`、`TermPolynomial`、`SparsePolynomial`、`ExponentVector` の値セマンティクス API。
- `immut/tutorial.md`: immutable な密、多変数、疎多項式の例。
- `immut/design.md`: 正規形と表現の不変条件。
- `mutable/api.md`: setter と `_inplace` メソッドを含む mutable API。
- `mutable/tutorial.md`: 原地更新と `immut` 変換の例。
- `mutable/design.md`: 変更境界と `immut` との意味論的対応。
