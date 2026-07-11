# core API

## 役割

`luna-generic` は LunaFlow の代数 trait 基盤レイヤです。数値アルゴリズム
やコンテナを直接提供するのではなく、上位パッケージが共有する能力境界を
定義します。

## 構造 traits

- `AddMonoid`、`MulMonoid`
- `AddGroup`、`MulGroup`
- `Semiring`、`Ring`、`Field`
- `Integral`
- `Nat`
- `NatHomomorphism`
- `IntegralHomomorphism`
- `Num`

これらは `src/structure.mbt` にあります。

## 操作 traits

- `Zero`
- `One`
- `Inverse`
- `Conjugate`

これらは `src/operation.mbt` にあります。

## 同梱インスタンス

- 符号付き整数：`Int`、`Int16`、`Int64`
- 符号なし整数：`UInt`、`UInt16`、`UInt64`
- 正確な大整数：`BigInt`
- 浮動小数点：`Float`、`Double`

## 意味論メモ

- `Integral::normalize(Self) -> BigInt` は任意の整数値を `BigInt` へ正規化する
  標準入口です。
- `Nat` も trait 継承により同じ `normalize(Self) -> BigInt` 経路を使います。
- `NatHomomorphism::from_nat` と `IntegralHomomorphism::from_integral` は、
  幅ごとの専用コンストラクタではなく、ソース trait に対する多相的な埋め込み入口です。
- 既定の埋め込み経路は `Integral::normalize` の後に対象型ごとの `BigInt`
  変換を呼ぶ形です。
- 符号なし整数は `Semiring` までで止まり、加法逆元を持つ構造のふりをしません。
- `Float` と `Double` の埋め込みは近似であり、大きな整数は丸められ得ます。

## ソース入口

- `src/structure.mbt`：trait 定義
- `src/operation.mbt`：基礎操作 traits
- `src/impl_signed.mbt`、`src/impl_unsigned.mbt`、`src/impl_bigint.mbt`、
  `src/impl_float.mbt`、`src/impl_dbl.mbt`：既定インスタンス
