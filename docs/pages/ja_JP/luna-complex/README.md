# Luna-Flow/luna-complex

このドキュメントは **v0.3.0** の現在ベースラインを追跡します。

## リポジトリの位置付け

汎用複素数コアと、独立した浮動小数点解析バックエンドを提供します。

## ドキュメント構成

- `README.md` にリポジトリ叙述とリリース基線を書く。
- `doc_standard.md` に文書契約を書く。
- モジュールまたはサブシステム配下に `api.md`、`tutorial.md`、`design.md` を置く。

## モジュール概要

- **`core`**: 汎用 `Complex[T]` の構築、更新、代数 trait 実装。
- **`float_backend`**: バックエンド内の浮動小数点 trait と、現在の `Complex[Double]` 解析関数面。

## ドキュメント入口

- API リファレンス: [core](/ja_JP/luna-complex/core/api)
- API リファレンス: [float_backend](/ja_JP/luna-complex/float_backend/api)
