# Arithmetic ドキュメント

このディレクトリは `arithmetic` `0.2.2` の日本語ドキュメント入口です。

## 概要

- 代数構造は引き続き `luna-generic` が担います。
- `arithmetic` は関数能力だけを表現し、「実数らしさ」を束ねた抽象は定義しません。
- `Float` と `Double` のインスタンス自体はルートパッケージにあり、`Kaida-Amethyst/math` を直接呼び出します。
- `BigInt` と整数族の基本型には、整数冪 `Power` のような閉じた能力だけを実装します。
- 浮動小数点の既定インスタンスは `Kaida-Amethyst/math` をそのままバックエンドとして使います。
- このパッケージは順序・位相・分岐・主値のような高次の解析的意味論までは扱いません。

## 能力レイヤー

- unchecked の elementary traits は、ネイティブ scalar や他の文脈非依存バックエンド向けに残します。
- checked/contextual traits は `Result[Self, ArithmeticError]` を返し、`ArithmeticContext` を受け取ります。
- enclosure traits は包含・重なり・確定比較を表し、無理に全順序を与えません。

## 意味論ノート

- 公開 trait は具体的な `Self` 型を保ち、補助的な結果型へ自動的に拡張しません。
- 具体インスタンスがより強い保証を明記しない限り、定義域の妥当性は呼び出し側契約の一部です。
- unchecked の `Float` と `Double` の特殊値、境界値、分岐の意味論は `Kaida-Amethyst/math` を継承します。
- checked `Float` と `Double` は、文書化された実数値の定義域失敗では構造化エラーを返します。たとえば checked 平方根に負の実数を渡すと `DomainError` になります。
- 現在の組み込み `Float` と `Double` の checked 操作は、`ArithmeticContext` による任意精度や丸め制御を適用しません。この context は文脈依存実装のための共有境界データです。
- 整数族のサポートは意図的に狭く、その型で閉じたまま扱える能力だけを実装します。
- `arithmetic` は capability-boundary package であり、この層で微積分・行列・複素数・記号代数・特殊関数を再導入しません。

## `Power` の事前条件

- `Power::pow` は浮動小数点族と整数族で同じインターフェースを共有しますが、全インスタンスが同じ引数領域を受け付けるわけではありません。
- `BigInt`、`Int`、`Int16`、`Int64` では指数は非負でなければなりません。
- これらの符号付き整数インスタンスに負の指数を渡すと実行時に `abort` します。
- `UInt`、`UInt16`、`UInt64` は指数型そのものが非負なので、この追加チェックは不要です。
- このパッケージは前提条件を文書化しますが、数学的な定義域を満たす引数選択は依然として一部が利用者責務です。
- `PowNatChecked` と `PowIntChecked` は整数指数能力を checked な境界として分離します。
- この checked レイヤーでは `x^0` は常に 1 を返し、`0^0` も含みます。
