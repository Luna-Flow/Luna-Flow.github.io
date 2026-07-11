# core チュートリアル

## 具体型ではなく構造に対してアルゴリズムを書く

```moonbit
fn double_and_add_one[T : Ring + One](x : T) -> T {
  x + x + T::one()
}
```

この関数は符号付き整数、`BigInt`、`Float`、`Double`、そして同じ traits
を実装した外部型に再利用できます。

## `BigInt` へ正規化する

```moonbit
fn canonical_text[T : Integral + Show](x : T) -> String {
  x.normalize().to_string()
}
```

複数の整数ソース型をまたいで 1 つの正確な表現を使いたいときは、
`Integral::normalize` を使います。

## 対象側埋め込みを明示する

```moonbit
fn embed_nat[F : NatHomomorphism](x : UInt) -> F {
  NatHomomorphism::from_nat(x)
}
```

これにより、上位パッケージが暗黙変換を勝手に前提化するのを防げます。

`NatHomomorphism` と `IntegralHomomorphism` は、まずソース値を
`Integral::normalize` で `BigInt` に正規化し、その後に対象型ごとの変換を
行うよう実装します。

## 実践ガイド

- アルゴリズムが本当に必要とする最小の trait 集合を選ぶ。
- 逆元や除法が必要なときだけ `Field` を要求する。
- `Float` と `Double` は同じ抽象面を持っていても近似バックエンドとして扱う。
