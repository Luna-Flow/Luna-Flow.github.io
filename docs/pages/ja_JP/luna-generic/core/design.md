# core 設計

## 設計目標

`luna-generic` は LunaFlow 全体に共有される代数語彙を与え、
`arithmetic`、`luna-complex`、`linear-algebra`、`luna-poly` などが同じ
能力境界を再利用できるようにします。

## 主な設計判断

- trait グラフを層化し、小さく保つ。
- `Ring`、`Field`、`Integral`、`Nat` のような構造 traits と、
  `Zero`、`One`、`Inverse`、`Conjugate` のような操作 traits を分離する。
- 埋め込みは `NatHomomorphism` と `IntegralHomomorphism` で明示する。
- `Integral::normalize` を `BigInt` への標準的な厳密ブリッジにする。
- 対象側の既定実装は、正規化済み `BigInt` を経由する。
- 符号なし型に加法逆元を主張させず、数学的整合性を保つ。

## 境界

- このパッケージは行列、複素数、多項式、解析関数、数値アルゴリズムを定義しません。
- 正確系と近似系の意味論差を無理に隠しません。
