# float_backend API

`Luna-Flow/luna-complex/float_backend` は、複素数向けの浮動小数点解析バックエンドを公開します。

## 範囲

- ソース境界: `src/float_backend`
- 想定読者: 公開契約に依存する利用者、統合担当者、保守者
- 状態: active

## 公開契約

- ルートパッケージの `Complex[T]` を再エクスポートします。
- バックエンド能力 trait として `FloatingAnalyticScalar`、`FloatingSpecialValues`、`FloatingBackendScalar` を定義します。
- `Float` と `Double` に対して、これらのバックエンド trait 実装を提供します。
- 現在の完全な解析関数面は `Complex[Double]` 向けです。極形式の構築、偏角と大きさの補助関数、平方根、指数、対数、累乗、三角関数、逆三角関数、双曲関数、逆双曲関数を含みます。
- IEEE 特殊値の扱い、分岐選択、数値安定性 helper は、汎用ルートパッケージではなくこのパッケージ内に置きます。
