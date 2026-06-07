# Luna-Flow/luna_thread

このドキュメントは現在のブランチ状態を追跡します。

## リポジトリの位置付け

ランタイムバックエンドと仕様資産を持つ MoonBit 並列 FFI 仕様ワークスペースです。

## ドキュメント構成

- `README.md` にリポジトリ叙述とリリース基線を書く。
- `doc_standard.md` に文書契約を書く。
- モジュールまたはサブシステム配下に `api.md`、`tutorial.md`、`design.md` を置く。

## モジュール概要

- **`facade`**: 主な実装は `luna_thread` にあります。
- **`backend`**: 主な実装は `native and js` にあります。
- **`spec`**: 主な実装は `docs` にあります。

## ドキュメント入口

- API リファレンス: [facade](./facade/api.md)
- API リファレンス: [backend](./backend/api.md)
- API リファレンス: [spec](./spec/api.md)
\n