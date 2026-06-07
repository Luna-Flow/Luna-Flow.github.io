# Luna-Generic

これは `Luna-Flow/luna-generic` の想定 `v0.3.2` リリース向け日本語ドキュメントです。

## 概要

`luna-generic` は Luna プロジェクト向けに、一般的な代数 trait と標準数値型の既定インスタンスを提供します。

このリリース候補の中心は次の 3 点です。

- `BigInt` が既定で公開される数値型に追加されました。
- 整数から対象型への埋め込みは、明示的な準同型 trait として整理されました。
- `Integral::normalize` により、すべての整数ソース型に対して正規化済みの `BigInt` 入口が追加されました。

## 公開 Trait

- `AddMonoid`, `MulMonoid`
- `AddGroup`, `MulGroup`
- `Semiring`, `Ring`, `Field`
- `Integral`, `Nat`
- `NatHomomorphism`, `IntegralHomomorphism`
- `Num`

## 公開演算と既定型

- 演算 trait: `One`, `Zero`, `Inverse`, `Conjugate`
- 既定数値型: `Int`, `Int16`, `Int64`, `UInt`, `UInt16`, `UInt64`, `BigInt`, `Float`, `Double`

## 整数モデル

- `Nat` は `UInt`、`UInt16`、`UInt64` を対象とします
- `Integral` は符号付き整数、符号なし整数、および `BigInt` を対象とします
- 符号なし整数インスタンスは `Semiring` までです
- `Integral::normalize` は任意の整数値を `BigInt` へ正規化します
- `Nat::to_integral` は `BigInt` への正確な埋め込みを提供します

## 埋め込み API

- `NatHomomorphism::{from_uint, from_uint16, from_uint64}` は自然数ソース型から対象型への埋め込みを提供します
- `IntegralHomomorphism::{from_int, from_int16, from_int64, from_bigint}` は整数ソース型から対象型への埋め込みを提供します
- `BigInt` への埋め込みは正確です
- `Float` と `Double` への埋め込みは近似であり、大きな値は丸められる可能性があります

## 検証

推奨するリリース前チェック:

```bash
moon check
moon test
```
